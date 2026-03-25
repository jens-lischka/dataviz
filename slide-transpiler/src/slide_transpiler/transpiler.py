"""Main transpiler pipeline — orchestrates the full slide conversion."""

import logging
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from typing import Optional

from .classifier import classify_slide
from .connectors import validate_connectors
from .dependencies import copy_dependencies
from .extractor import count_slides, extract_slide
from .namespaces import NS, REL_TYPES
from .placeholder import get_placeholder_mapping, remap_placeholders
from .validator import ValidationResult, validate_output

logger = logging.getLogger(__name__)


class VirtualZip:
    """In-memory file store that acts like a writable ZipFile.

    Avoids duplicate-entry issues with Python's zipfile module by
    using a dict. Supports read/write/overwrite of entries, then
    flush to a real zip file at the end.
    """

    def __init__(self) -> None:
        self._files: dict[str, bytes] = {}

    def writestr(self, name: str, data: bytes | str) -> None:
        if isinstance(data, str):
            data = data.encode("utf-8")
        self._files[name] = data

    def read(self, name: str) -> bytes:
        if name not in self._files:
            raise KeyError(name)
        return self._files[name]

    def namelist(self) -> list[str]:
        return list(self._files.keys())

    def flush_to(self, path: Path) -> None:
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
            for name, data in self._files.items():
                zf.writestr(name, data)


def _generate_rid(existing: set[str]) -> str:
    i = 1
    while f"rId{i}" in existing:
        i += 1
    return f"rId{i}"


def _register_slide(vzip: VirtualZip, slide_id: int) -> None:
    """Register a slide in content types, presentation rels, and presentation.xml."""
    # 1. Content types
    ct_path = "[Content_Types].xml"
    part_name = f"/ppt/slides/slide{slide_id}.xml"
    content_type = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml"
    ct_ns = "http://schemas.openxmlformats.org/package/2006/content-types"

    try:
        ct_xml = vzip.read(ct_path)
        ET.register_namespace("", ct_ns)
        ct_root = ET.fromstring(ct_xml)

        already = any(
            o.attrib.get("PartName") == part_name
            for o in ct_root.findall("{%s}Override" % ct_ns)
        )
        if not already:
            ET.SubElement(ct_root, "{%s}Override" % ct_ns, {
                "PartName": part_name,
                "ContentType": content_type,
            })
            vzip.writestr(ct_path, ET.tostring(ct_root, encoding="utf-8", xml_declaration=True))
    except KeyError:
        pass

    # 2. Presentation rels
    rels_path = "ppt/_rels/presentation.xml.rels"
    target = f"slides/slide{slide_id}.xml"
    rel_ns = "http://schemas.openxmlformats.org/package/2006/relationships"

    try:
        rels_xml = vzip.read(rels_path)
        ET.register_namespace("", rel_ns)
        rels_root = ET.fromstring(rels_xml)

        already = any(rel.attrib.get("Target") == target for rel in rels_root)
        if not already:
            existing = {rel.attrib.get("Id", "") for rel in rels_root}
            new_rid = _generate_rid(existing)
            ET.SubElement(rels_root, "{%s}Relationship" % rel_ns, {
                "Id": new_rid,
                "Type": REL_TYPES["slide"],
                "Target": target,
            })
            vzip.writestr(rels_path, ET.tostring(rels_root, encoding="utf-8", xml_declaration=True))
    except KeyError:
        pass

    # 3. Presentation.xml — add to sldIdLst
    pres_path = "ppt/presentation.xml"

    try:
        pres_xml = vzip.read(pres_path)
        for prefix, uri in NS.items():
            ET.register_namespace(prefix, uri)

        pres_root = ET.fromstring(pres_xml)

        sld_id_lst = pres_root.find("{%s}sldIdLst" % NS["p"])
        if sld_id_lst is None:
            sld_id_lst = ET.SubElement(pres_root, "{%s}sldIdLst" % NS["p"])

        # Find the rId we just created
        rels_xml = vzip.read(rels_path)
        rels_root = ET.fromstring(rels_xml)
        rid = None
        for rel in rels_root:
            if rel.attrib.get("Target") == target:
                rid = rel.attrib.get("Id")
                break

        if rid is None:
            return

        # Check not already present
        already = any(
            s.attrib.get("{%s}id" % NS["r"]) == rid
            for s in sld_id_lst
        )
        if already:
            return

        max_id = 255
        for s in sld_id_lst:
            current = int(s.attrib.get("id", "255"))
            max_id = max(max_id, current)

        ET.SubElement(sld_id_lst, "{%s}sldId" % NS["p"], {
            "id": str(max_id + 1),
            "{%s}id" % NS["r"]: rid,
        })

        vzip.writestr(pres_path, ET.tostring(pres_root, encoding="utf-8", xml_declaration=True))
    except KeyError:
        pass


def transpile(
    src_file: str | Path,
    template_file: str | Path,
    output_file: str | Path,
    custom_mappings: Optional[dict[str, dict[str, str]]] = None,
    validate: bool = True,
) -> ValidationResult:
    """Transpile all slides from source PPTX into a target template.

    Pipeline:
    1. Copy template as base for output (into virtual zip)
    2. For each source slide:
       a. Extract slide + dependencies
       b. Classify slide type
       c. Remap placeholders to target template
       d. Validate connectors
       e. Inject into virtual zip
       f. Copy dependencies (charts, media, embeddings)
       g. Register slide in presentation manifest
    3. Flush virtual zip to output file
    4. Validate output

    Args:
        src_file: Path to the source PPTX file.
        template_file: Path to the target template PPTX.
        output_file: Path for the output PPTX.
        custom_mappings: Optional per-slide-type placeholder mappings.
        validate: Whether to run validation after transpiling.

    Returns:
        ValidationResult (always returned, check .valid for pass/fail).
    """
    src_file = Path(src_file)
    template_file = Path(template_file)
    output_file = Path(output_file)

    logger.info("Starting transpile: %s → %s (template: %s)", src_file, output_file, template_file)

    vzip = VirtualZip()

    with zipfile.ZipFile(src_file, "r") as src, zipfile.ZipFile(template_file, "r") as tpl:
        # Step 1: Copy entire template as the base (skip template slides)
        for item in tpl.infolist():
            if item.filename.startswith("ppt/slides/slide") and item.filename.endswith(".xml"):
                continue
            if item.filename.startswith("ppt/slides/_rels/slide") and item.filename.endswith(".xml.rels"):
                continue
            vzip.writestr(item.filename, tpl.read(item.filename))

        logger.info("Template base copied")

        # Step 2: Process each source slide
        slide_count = count_slides(src)
        logger.info("Source contains %d slides", slide_count)

        for i in range(1, slide_count + 1):
            logger.info("Processing slide %d/%d", i, slide_count)

            # 2a. Extract
            pkg = extract_slide(src, i)

            # 2b. Classify
            layout_type = classify_slide(pkg.slide_xml)
            logger.info("  Slide %d classified as: %s", i, layout_type)

            # 2c. Remap placeholders
            custom = None
            if custom_mappings and layout_type in custom_mappings:
                custom = custom_mappings[layout_type]
            mapping = get_placeholder_mapping(layout_type, custom)
            slide_xml = remap_placeholders(pkg.slide_xml, mapping)

            # 2d. Validate connectors
            slide_xml = validate_connectors(slide_xml)

            # 2e. Inject slide
            vzip.writestr(f"ppt/slides/slide{i}.xml", slide_xml)
            vzip.writestr(f"ppt/slides/_rels/slide{i}.xml.rels", pkg.rels_xml)

            # 2f. Copy dependencies
            for dep in pkg.dependencies:
                try:
                    vzip.writestr(dep, src.read(dep))
                    logger.debug("Copied dependency: %s", dep)
                except KeyError:
                    logger.warning("Dependency not found: %s", dep)

            # 2g. Register slide
            _register_slide(vzip, i)

        logger.info("All slides processed")

    # Step 3: Write output
    vzip.flush_to(output_file)
    logger.info("Output written to %s", output_file)

    # Step 4: Validate
    if validate:
        with zipfile.ZipFile(output_file, "r") as check:
            result = validate_output(check, slide_count)

        if result.valid:
            logger.info("Output validation PASSED")
        else:
            logger.error("Output validation FAILED:")
            for err in result.errors:
                logger.error("  ERROR: %s", err)
            for warn in result.warnings:
                logger.warning("  WARNING: %s", warn)

        return result

    return ValidationResult()

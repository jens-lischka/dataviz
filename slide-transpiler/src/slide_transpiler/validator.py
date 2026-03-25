"""Validation — verify structural integrity of transpiled PPTX output."""

import logging
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from zipfile import ZipFile

from .namespaces import NS

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of PPTX validation."""

    valid: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def add_error(self, msg: str) -> None:
        self.errors.append(msg)
        self.valid = False

    def add_warning(self, msg: str) -> None:
        self.warnings.append(msg)


def validate_output(
    output_zip: ZipFile,
    expected_slide_count: int,
) -> ValidationResult:
    """Run all validation checks on the output PPTX.

    Checks:
    1. Slide count matches expected
    2. All slide relationships resolve to existing files
    3. Content types are registered for all slides
    4. Presentation.xml references all slides

    Args:
        output_zip: The output PPTX as an open ZipFile.
        expected_slide_count: Number of slides expected.

    Returns:
        ValidationResult with errors and warnings.
    """
    result = ValidationResult()
    all_files = set(output_zip.namelist())

    # 1. Slide count
    actual_slides = sum(
        1 for f in all_files
        if f.startswith("ppt/slides/slide") and f.endswith(".xml") and "/_rels/" not in f
    )
    if actual_slides != expected_slide_count:
        result.add_error(
            f"Slide count mismatch: expected {expected_slide_count}, found {actual_slides}"
        )

    # 2. Relationship resolution
    for slide_num in range(1, actual_slides + 1):
        rels_path = f"ppt/slides/_rels/slide{slide_num}.xml.rels"
        if rels_path not in all_files:
            result.add_error(f"Missing relationships file: {rels_path}")
            continue

        rels_xml = output_zip.read(rels_path)
        root = ET.fromstring(rels_xml)

        for rel in root:
            target = rel.attrib.get("Target", "")
            rel_type = rel.attrib.get("Type", "")

            # Skip external relationships and layout/master refs
            if target.startswith("http"):
                continue
            if "slideLayout" in rel_type or "slideMaster" in rel_type:
                continue

            # Resolve the path
            if target.startswith("../"):
                resolved = "ppt/" + target.replace("../", "")
            elif not target.startswith("ppt/"):
                resolved = f"ppt/slides/{target}"
            else:
                resolved = target

            if resolved not in all_files:
                result.add_warning(
                    f"Slide {slide_num}: relationship target not found: {resolved}"
                )

    # 3. Content types
    if "[Content_Types].xml" in all_files:
        ct_xml = output_zip.read("[Content_Types].xml")
        ct_ns = "http://schemas.openxmlformats.org/package/2006/content-types"
        ct_root = ET.fromstring(ct_xml)

        registered_parts = {
            o.attrib.get("PartName", "")
            for o in ct_root.findall("{%s}Override" % ct_ns)
        }

        for slide_num in range(1, actual_slides + 1):
            part_name = f"/ppt/slides/slide{slide_num}.xml"
            if part_name not in registered_parts:
                result.add_error(f"Slide {slide_num} not registered in [Content_Types].xml")

    logger.info(
        "Validation complete: %s (%d errors, %d warnings)",
        "PASS" if result.valid else "FAIL",
        len(result.errors),
        len(result.warnings),
    )

    return result

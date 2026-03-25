"""Relationship manager — maintain valid rId references and slide registration."""

import xml.etree.ElementTree as ET
from zipfile import ZipFile

from .namespaces import NS, REL_TYPES


def generate_rid(existing: set[str]) -> str:
    """Generate the next available relationship ID.

    Args:
        existing: Set of already-used rId strings.

    Returns:
        Next available rId (e.g., "rId5").
    """
    i = 1
    while f"rId{i}" in existing:
        i += 1
    return f"rId{i}"


def get_existing_rids(rels_xml: bytes) -> set[str]:
    """Extract all existing rId values from a relationships XML."""
    root = ET.fromstring(rels_xml)
    return {rel.attrib.get("Id", "") for rel in root}


def register_slide(out_zip: ZipFile, slide_id: int) -> None:
    """Register a slide in the presentation.xml and [Content_Types].xml.

    This ensures the slide is:
    1. Listed in ppt/presentation.xml's slide list
    2. Referenced via a relationship in ppt/_rels/presentation.xml.rels
    3. Has a content type entry in [Content_Types].xml

    Args:
        out_zip: Output PPTX as open ZipFile (writable).
        slide_id: 1-based slide index.
    """
    _register_in_content_types(out_zip, slide_id)
    _register_in_presentation_rels(out_zip, slide_id)
    _register_in_presentation(out_zip, slide_id)


def _register_in_content_types(out_zip: ZipFile, slide_id: int) -> None:
    """Add slide to [Content_Types].xml if not already present."""
    ct_path = "[Content_Types].xml"
    part_name = f"/ppt/slides/slide{slide_id}.xml"
    content_type = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml"

    try:
        ct_xml = out_zip.read(ct_path)
    except KeyError:
        return

    ct_ns = "http://schemas.openxmlformats.org/package/2006/content-types"
    ET.register_namespace("", ct_ns)
    root = ET.fromstring(ct_xml)

    # Check if already registered
    for override in root.findall("{%s}Override" % ct_ns):
        if override.attrib.get("PartName") == part_name:
            return  # Already registered

    # Add override entry
    ET.SubElement(root, "{%s}Override" % ct_ns, {
        "PartName": part_name,
        "ContentType": content_type,
    })

    # We can't update in-place in a ZipFile, so we track this for the final write
    out_zip.writestr(ct_path, ET.tostring(root, encoding="utf-8", xml_declaration=True))


def _register_in_presentation_rels(out_zip: ZipFile, slide_id: int) -> None:
    """Add slide relationship to ppt/_rels/presentation.xml.rels."""
    rels_path = "ppt/_rels/presentation.xml.rels"
    target = f"slides/slide{slide_id}.xml"

    try:
        rels_xml = out_zip.read(rels_path)
    except KeyError:
        return

    rel_ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    ET.register_namespace("", rel_ns)
    root = ET.fromstring(rels_xml)

    # Check if already registered
    for rel in root:
        if rel.attrib.get("Target") == target:
            return

    # Find next rId
    existing = {rel.attrib.get("Id", "") for rel in root}
    new_rid = generate_rid(existing)

    ET.SubElement(root, "{%s}Relationship" % rel_ns, {
        "Id": new_rid,
        "Type": REL_TYPES["slide"],
        "Target": target,
    })

    out_zip.writestr(rels_path, ET.tostring(root, encoding="utf-8", xml_declaration=True))


def _register_in_presentation(out_zip: ZipFile, slide_id: int) -> None:
    """Add slide reference to ppt/presentation.xml's slide list."""
    pres_path = "ppt/presentation.xml"

    try:
        pres_xml = out_zip.read(pres_path)
    except KeyError:
        return

    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)
    # Also register the relationships namespace commonly used
    ET.register_namespace("r", NS["r"])

    root = ET.fromstring(pres_xml)

    # Find the sldIdLst element
    sld_id_lst = root.find("{%s}sldIdLst" % NS["p"])
    if sld_id_lst is None:
        sld_id_lst = ET.SubElement(root, "{%s}sldIdLst" % NS["p"])

    # Get the rId for this slide from presentation.xml.rels
    rels_path = "ppt/_rels/presentation.xml.rels"
    target = f"slides/slide{slide_id}.xml"
    rid = None

    try:
        rels_xml = out_zip.read(rels_path)
        rels_root = ET.fromstring(rels_xml)
        for rel in rels_root:
            if rel.attrib.get("Target") == target:
                rid = rel.attrib.get("Id")
                break
    except KeyError:
        return

    if rid is None:
        return

    # Check if already registered
    for sld_id in sld_id_lst:
        if sld_id.attrib.get("{%s}id" % NS["r"]) == rid:
            return

    # Calculate next slide ID (must be >= 256 per OOXML spec)
    max_id = 255
    for sld_id in sld_id_lst:
        current_id = int(sld_id.attrib.get("id", "255"))
        max_id = max(max_id, current_id)

    ET.SubElement(sld_id_lst, "{%s}sldId" % NS["p"], {
        "id": str(max_id + 1),
        "{%s}id" % NS["r"]: rid,
    })

    out_zip.writestr(pres_path, ET.tostring(root, encoding="utf-8", xml_declaration=True))

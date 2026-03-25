"""Test fixtures — generate minimal valid PPTX files for testing."""

import xml.etree.ElementTree as ET
import zipfile
from io import BytesIO
from pathlib import Path

import pytest


def make_content_types_xml(slide_count: int = 1) -> bytes:
    """Generate a minimal [Content_Types].xml."""
    ns = "http://schemas.openxmlformats.org/package/2006/content-types"
    root = ET.Element(f"{{{ns}}}Types")

    # Default extensions
    ET.SubElement(root, f"{{{ns}}}Default", {
        "Extension": "xml",
        "ContentType": "application/xml",
    })
    ET.SubElement(root, f"{{{ns}}}Default", {
        "Extension": "rels",
        "ContentType": "application/vnd.openxmlformats-package.relationships+xml",
    })

    # Presentation
    ET.SubElement(root, f"{{{ns}}}Override", {
        "PartName": "/ppt/presentation.xml",
        "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
    })

    # Slide layouts
    ET.SubElement(root, f"{{{ns}}}Override", {
        "PartName": "/ppt/slideLayouts/slideLayout1.xml",
        "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml",
    })

    # Slide masters
    ET.SubElement(root, f"{{{ns}}}Override", {
        "PartName": "/ppt/slideMasters/slideMaster1.xml",
        "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",
    })

    # Slides
    for i in range(1, slide_count + 1):
        ET.SubElement(root, f"{{{ns}}}Override", {
            "PartName": f"/ppt/slides/slide{i}.xml",
            "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
        })

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_presentation_xml(slide_count: int = 1) -> bytes:
    """Generate a minimal ppt/presentation.xml."""
    p_ns = "http://schemas.openxmlformats.org/presentationml/2006/main"
    r_ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    a_ns = "http://schemas.openxmlformats.org/drawingml/2006/main"

    ET.register_namespace("p", p_ns)
    ET.register_namespace("r", r_ns)
    ET.register_namespace("a", a_ns)

    root = ET.Element(f"{{{p_ns}}}presentation")
    sld_id_lst = ET.SubElement(root, f"{{{p_ns}}}sldIdLst")

    for i in range(1, slide_count + 1):
        ET.SubElement(sld_id_lst, f"{{{p_ns}}}sldId", {
            "id": str(255 + i),
            f"{{{r_ns}}}id": f"rId{i}",
        })

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_presentation_rels_xml(slide_count: int = 1) -> bytes:
    """Generate ppt/_rels/presentation.xml.rels."""
    ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    ET.register_namespace("", ns)
    root = ET.Element(f"{{{ns}}}Relationships")

    for i in range(1, slide_count + 1):
        ET.SubElement(root, f"{{{ns}}}Relationship", {
            "Id": f"rId{i}",
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
            "Target": f"slides/slide{i}.xml",
        })

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_slide_xml(
    shapes: int = 2,
    has_chart: bool = False,
    has_table: bool = False,
    has_connector: bool = False,
    connector_valid: bool = True,
    placeholder_idxs: list[str] | None = None,
) -> bytes:
    """Generate a minimal slide XML for testing."""
    p_ns = "http://schemas.openxmlformats.org/presentationml/2006/main"
    a_ns = "http://schemas.openxmlformats.org/drawingml/2006/main"
    r_ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

    ET.register_namespace("p", p_ns)
    ET.register_namespace("a", a_ns)
    ET.register_namespace("r", r_ns)

    root = ET.Element(f"{{{p_ns}}}sld")
    sp_tree = ET.SubElement(
        ET.SubElement(root, f"{{{p_ns}}}cSld"),
        f"{{{p_ns}}}spTree",
    )

    # Add shapes
    for i in range(shapes):
        sp = ET.SubElement(sp_tree, f"{{{p_ns}}}sp")
        nv = ET.SubElement(sp, f"{{{p_ns}}}nvSpPr")
        cnv = ET.SubElement(nv, f"{{{p_ns}}}cNvPr", {"id": str(i + 1), "name": f"Shape {i + 1}"})

        # Add placeholder if specified
        if placeholder_idxs and i < len(placeholder_idxs):
            nv_sp = ET.SubElement(nv, f"{{{p_ns}}}nvPr")
            ET.SubElement(nv_sp, f"{{{p_ns}}}ph", {"idx": placeholder_idxs[i]})

        # Add text body
        tx_body = ET.SubElement(sp, f"{{{p_ns}}}txBody")
        p_elem = ET.SubElement(tx_body, f"{{{a_ns}}}p")
        r_elem = ET.SubElement(p_elem, f"{{{a_ns}}}r")
        ET.SubElement(r_elem, f"{{{a_ns}}}t").text = f"Text {i + 1}"

    # Add chart (graphicFrame)
    if has_chart:
        gf = ET.SubElement(sp_tree, f"{{{p_ns}}}graphicFrame")
        ET.SubElement(gf, f"{{{p_ns}}}nvGraphicFramePr")

    # Add table
    if has_table:
        sp = ET.SubElement(sp_tree, f"{{{p_ns}}}sp")
        tx = ET.SubElement(sp, f"{{{p_ns}}}txBody")
        tbl = ET.SubElement(tx, f"{{{a_ns}}}tbl")
        ET.SubElement(tbl, f"{{{a_ns}}}tr")

    # Add connector
    if has_connector:
        cxn = ET.SubElement(sp_tree, f"{{{p_ns}}}cxnSp")
        nv = ET.SubElement(cxn, f"{{{p_ns}}}nvCxnSpPr")
        ET.SubElement(nv, f"{{{p_ns}}}cNvPr", {"id": "99", "name": "Connector 1"})
        sp_pr = ET.SubElement(cxn, f"{{{p_ns}}}spPr")

        if connector_valid:
            ET.SubElement(sp_pr, f"{{{a_ns}}}stCxn", {"id": "1", "idx": "2"})
            ET.SubElement(sp_pr, f"{{{a_ns}}}endCxn", {"id": "2", "idx": "0"})
        # If not valid, we leave out the connections

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_slide_rels_xml(
    layout_rid: str = "rId1",
    extra_deps: list[tuple[str, str, str]] | None = None,
) -> bytes:
    """Generate slide relationship XML.

    Args:
        layout_rid: rId for the slide layout reference.
        extra_deps: List of (rId, type_uri, target) tuples for additional deps.
    """
    ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    ET.register_namespace("", ns)
    root = ET.Element(f"{{{ns}}}Relationships")

    ET.SubElement(root, f"{{{ns}}}Relationship", {
        "Id": layout_rid,
        "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
        "Target": "../slideLayouts/slideLayout1.xml",
    })

    if extra_deps:
        for rid, rel_type, target in extra_deps:
            ET.SubElement(root, f"{{{ns}}}Relationship", {
                "Id": rid,
                "Type": rel_type,
                "Target": target,
            })

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_pptx(
    slide_count: int = 1,
    slide_xml_fn=None,
    slide_rels_fn=None,
    extra_files: dict[str, bytes] | None = None,
) -> BytesIO:
    """Create a minimal but valid PPTX in memory.

    Args:
        slide_count: Number of slides.
        slide_xml_fn: Optional callable(slide_id) -> bytes for custom slide XML.
        slide_rels_fn: Optional callable(slide_id) -> bytes for custom rels XML.
        extra_files: Additional files to include in the zip.

    Returns:
        BytesIO containing the PPTX zip.
    """
    buf = BytesIO()

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", make_content_types_xml(slide_count))
        zf.writestr("ppt/presentation.xml", make_presentation_xml(slide_count))
        zf.writestr("ppt/_rels/presentation.xml.rels", make_presentation_rels_xml(slide_count))

        # Minimal slide layout and master
        p_ns = "http://schemas.openxmlformats.org/presentationml/2006/main"
        layout = ET.Element(f"{{{p_ns}}}sldLayout")
        zf.writestr("ppt/slideLayouts/slideLayout1.xml",
                     ET.tostring(layout, encoding="utf-8", xml_declaration=True))

        master = ET.Element(f"{{{p_ns}}}sldMaster")
        zf.writestr("ppt/slideMasters/slideMaster1.xml",
                     ET.tostring(master, encoding="utf-8", xml_declaration=True))

        for i in range(1, slide_count + 1):
            if slide_xml_fn:
                slide = slide_xml_fn(i)
            else:
                slide = make_slide_xml()

            if slide_rels_fn:
                rels = slide_rels_fn(i)
            else:
                rels = make_slide_rels_xml()

            zf.writestr(f"ppt/slides/slide{i}.xml", slide)
            zf.writestr(f"ppt/slides/_rels/slide{i}.xml.rels", rels)

        if extra_files:
            for path, data in extra_files.items():
                zf.writestr(path, data)

    buf.seek(0)
    return buf


@pytest.fixture
def simple_source(tmp_path: Path) -> Path:
    """Create a simple 2-slide source PPTX."""
    buf = make_pptx(slide_count=2)
    path = tmp_path / "source.pptx"
    path.write_bytes(buf.read())
    return path


@pytest.fixture
def simple_template(tmp_path: Path) -> Path:
    """Create a simple template PPTX."""
    buf = make_pptx(slide_count=1)
    path = tmp_path / "template.pptx"
    path.write_bytes(buf.read())
    return path


@pytest.fixture
def output_path(tmp_path: Path) -> Path:
    """Output path for transpiled PPTX."""
    return tmp_path / "output.pptx"

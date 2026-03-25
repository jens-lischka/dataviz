"""Generate sample PPTX files and run the transpiler end-to-end."""

import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

# --- Namespace setup ---
P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
SLIDE_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"
LAYOUT_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
MASTER_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster"

ET.register_namespace("p", P_NS)
ET.register_namespace("a", A_NS)
ET.register_namespace("r", R_NS)


def emu(inches: float) -> str:
    """Convert inches to EMUs (English Metric Units)."""
    return str(int(inches * 914400))


def make_text_shape(sp_tree, shape_id, name, x, y, w, h, text, font_size=1800,
                    bold=False, ph_idx=None, ph_type=None):
    """Add a text shape to the shape tree."""
    sp = ET.SubElement(sp_tree, f"{{{P_NS}}}sp")

    # Non-visual properties
    nv_sp_pr = ET.SubElement(sp, f"{{{P_NS}}}nvSpPr")
    ET.SubElement(nv_sp_pr, f"{{{P_NS}}}cNvPr", {"id": str(shape_id), "name": name})
    ET.SubElement(nv_sp_pr, f"{{{P_NS}}}cNvSpPr")
    nv_pr = ET.SubElement(nv_sp_pr, f"{{{P_NS}}}nvPr")

    if ph_idx is not None:
        attrs = {"idx": str(ph_idx)}
        if ph_type:
            attrs["type"] = ph_type
        ET.SubElement(nv_pr, f"{{{P_NS}}}ph", attrs)

    # Shape properties (position + size)
    sp_pr = ET.SubElement(sp, f"{{{P_NS}}}spPr")
    xfrm = ET.SubElement(sp_pr, f"{{{A_NS}}}xfrm")
    ET.SubElement(xfrm, f"{{{A_NS}}}off", {"x": emu(x), "y": emu(y)})
    ET.SubElement(xfrm, f"{{{A_NS}}}ext", {"cx": emu(w), "cy": emu(h)})

    prstGeom = ET.SubElement(sp_pr, f"{{{A_NS}}}prstGeom", {"prst": "rect"})
    ET.SubElement(prstGeom, f"{{{A_NS}}}avLst")

    # Text body
    tx_body = ET.SubElement(sp, f"{{{P_NS}}}txBody")
    ET.SubElement(tx_body, f"{{{A_NS}}}bodyPr")
    ET.SubElement(tx_body, f"{{{A_NS}}}lstStyle")

    p = ET.SubElement(tx_body, f"{{{A_NS}}}p")
    r = ET.SubElement(p, f"{{{A_NS}}}r")
    rPr = ET.SubElement(r, f"{{{A_NS}}}rPr", {"lang": "en-US", "sz": str(font_size)})
    if bold:
        rPr.set("b", "1")
    ET.SubElement(r, f"{{{A_NS}}}t").text = text

    return sp


def make_slide_xml(shapes_data):
    """Create a slide XML with the given shapes."""
    root = ET.Element(f"{{{P_NS}}}sld")
    cSld = ET.SubElement(root, f"{{{P_NS}}}cSld")
    sp_tree = ET.SubElement(cSld, f"{{{P_NS}}}spTree")

    # Group shape properties (required)
    grp_sp_pr = ET.SubElement(sp_tree, f"{{{P_NS}}}grpSpPr")
    xfrm = ET.SubElement(grp_sp_pr, f"{{{A_NS}}}xfrm")
    ET.SubElement(xfrm, f"{{{A_NS}}}off", {"x": "0", "y": "0"})
    ET.SubElement(xfrm, f"{{{A_NS}}}ext", {"cx": "0", "cy": "0"})
    ET.SubElement(xfrm, f"{{{A_NS}}}chOff", {"x": "0", "y": "0"})
    ET.SubElement(xfrm, f"{{{A_NS}}}chExt", {"cx": "0", "cy": "0"})

    for i, s in enumerate(shapes_data, start=2):
        make_text_shape(sp_tree, i, s["name"], s["x"], s["y"], s["w"], s["h"],
                        s["text"], s.get("font_size", 1800), s.get("bold", False),
                        s.get("ph_idx"), s.get("ph_type"))

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_slide_rels(layout_num=1):
    """Create slide relationships XML."""
    ET.register_namespace("", REL_NS)
    root = ET.Element(f"{{{REL_NS}}}Relationships")
    ET.SubElement(root, f"{{{REL_NS}}}Relationship", {
        "Id": "rId1",
        "Type": LAYOUT_REL_TYPE,
        "Target": f"../slideLayouts/slideLayout{layout_num}.xml",
    })
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_content_types(slide_count):
    ET.register_namespace("", CT_NS)
    root = ET.Element(f"{{{CT_NS}}}Types")
    ET.SubElement(root, f"{{{CT_NS}}}Default", {"Extension": "xml", "ContentType": "application/xml"})
    ET.SubElement(root, f"{{{CT_NS}}}Default", {"Extension": "rels", "ContentType": "application/vnd.openxmlformats-package.relationships+xml"})
    ET.SubElement(root, f"{{{CT_NS}}}Override", {
        "PartName": "/ppt/presentation.xml",
        "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
    })
    ET.SubElement(root, f"{{{CT_NS}}}Override", {
        "PartName": "/ppt/slideMasters/slideMaster1.xml",
        "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",
    })
    ET.SubElement(root, f"{{{CT_NS}}}Override", {
        "PartName": "/ppt/slideLayouts/slideLayout1.xml",
        "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml",
    })
    for i in range(1, slide_count + 1):
        ET.SubElement(root, f"{{{CT_NS}}}Override", {
            "PartName": f"/ppt/slides/slide{i}.xml",
            "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
        })
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_presentation_xml(slide_count):
    root = ET.Element(f"{{{P_NS}}}presentation")
    sld_master_lst = ET.SubElement(root, f"{{{P_NS}}}sldMasterIdLst")
    ET.SubElement(sld_master_lst, f"{{{P_NS}}}sldMasterId", {
        "id": "2147483648",
        f"{{{R_NS}}}id": f"rId{slide_count + 1}",
    })
    sld_id_lst = ET.SubElement(root, f"{{{P_NS}}}sldIdLst")
    for i in range(1, slide_count + 1):
        ET.SubElement(sld_id_lst, f"{{{P_NS}}}sldId", {
            "id": str(255 + i),
            f"{{{R_NS}}}id": f"rId{i}",
        })
    sld_sz = ET.SubElement(root, f"{{{P_NS}}}sldSz", {"cx": "12192000", "cy": "6858000"})
    notes_sz = ET.SubElement(root, f"{{{P_NS}}}notesSz", {"cx": "6858000", "cy": "9144000"})
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_presentation_rels(slide_count):
    ET.register_namespace("", REL_NS)
    root = ET.Element(f"{{{REL_NS}}}Relationships")
    for i in range(1, slide_count + 1):
        ET.SubElement(root, f"{{{REL_NS}}}Relationship", {
            "Id": f"rId{i}",
            "Type": SLIDE_REL_TYPE,
            "Target": f"slides/slide{i}.xml",
        })
    ET.SubElement(root, f"{{{REL_NS}}}Relationship", {
        "Id": f"rId{slide_count + 1}",
        "Type": MASTER_REL_TYPE,
        "Target": "slideMasters/slideMaster1.xml",
    })
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_slide_layout():
    root = ET.Element(f"{{{P_NS}}}sldLayout")
    root.set("type", "blank")
    cSld = ET.SubElement(root, f"{{{P_NS}}}cSld", {"name": "Blank"})
    ET.SubElement(cSld, f"{{{P_NS}}}spTree")
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_slide_master():
    root = ET.Element(f"{{{P_NS}}}sldMaster")
    cSld = ET.SubElement(root, f"{{{P_NS}}}cSld")
    ET.SubElement(cSld, f"{{{P_NS}}}spTree")
    sld_layout_lst = ET.SubElement(root, f"{{{P_NS}}}sldLayoutIdLst")
    ET.SubElement(sld_layout_lst, f"{{{P_NS}}}sldLayoutId", {
        "id": "2147483649",
        f"{{{R_NS}}}id": "rId1",
    })
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_slide_master_rels():
    ET.register_namespace("", REL_NS)
    root = ET.Element(f"{{{REL_NS}}}Relationships")
    ET.SubElement(root, f"{{{REL_NS}}}Relationship", {
        "Id": "rId1",
        "Type": LAYOUT_REL_TYPE,
        "Target": "../slideLayouts/slideLayout1.xml",
    })
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def make_slide_layout_rels():
    ET.register_namespace("", REL_NS)
    root = ET.Element(f"{{{REL_NS}}}Relationships")
    ET.SubElement(root, f"{{{REL_NS}}}Relationship", {
        "Id": "rId1",
        "Type": MASTER_REL_TYPE,
        "Target": "../slideMasters/slideMaster1.xml",
    })
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def build_pptx(path: Path, slides_data: list[list[dict]]):
    """Build a complete PPTX file."""
    slide_count = len(slides_data)

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", make_content_types(slide_count))
        zf.writestr("ppt/presentation.xml", make_presentation_xml(slide_count))
        zf.writestr("ppt/_rels/presentation.xml.rels", make_presentation_rels(slide_count))
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", make_slide_layout())
        zf.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", make_slide_layout_rels())
        zf.writestr("ppt/slideMasters/slideMaster1.xml", make_slide_master())
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", make_slide_master_rels())

        for i, shapes in enumerate(slides_data, start=1):
            zf.writestr(f"ppt/slides/slide{i}.xml", make_slide_xml(shapes))
            zf.writestr(f"ppt/slides/_rels/slide{i}.xml.rels", make_slide_rels())


# ============================================================
# BUILD SAMPLE SOURCE PPTX (3 slides with real content)
# ============================================================
samples_dir = Path(__file__).parent

source_slides = [
    # Slide 1: Title slide
    [
        {"name": "Title", "x": 1.0, "y": 2.0, "w": 8.0, "h": 1.5,
         "text": "Q4 2025 Strategy Review", "font_size": 3600, "bold": True,
         "ph_idx": 0, "ph_type": "ctrTitle"},
        {"name": "Subtitle", "x": 1.5, "y": 4.0, "w": 7.0, "h": 0.8,
         "text": "Prepared by the Strategy Team — Confidential", "font_size": 1800,
         "ph_idx": 1, "ph_type": "subTitle"},
    ],
    # Slide 2: Content slide with bullet points
    [
        {"name": "Title", "x": 0.5, "y": 0.3, "w": 9.0, "h": 0.8,
         "text": "Key Findings", "font_size": 2800, "bold": True,
         "ph_idx": 0, "ph_type": "title"},
        {"name": "Content", "x": 0.5, "y": 1.5, "w": 9.0, "h": 4.5,
         "text": "Revenue grew 23% YoY driven by enterprise segment. "
                 "Customer retention improved to 94%. "
                 "Three new markets entered in APAC region.",
         "font_size": 1600, "ph_idx": 1, "ph_type": "body"},
        {"name": "Footer", "x": 0.5, "y": 6.5, "w": 4.0, "h": 0.3,
         "text": "Confidential — Do Not Distribute", "font_size": 1000},
    ],
    # Slide 3: Another content slide
    [
        {"name": "Title", "x": 0.5, "y": 0.3, "w": 9.0, "h": 0.8,
         "text": "Next Steps & Timeline", "font_size": 2800, "bold": True,
         "ph_idx": 0, "ph_type": "title"},
        {"name": "Content", "x": 0.5, "y": 1.5, "w": 9.0, "h": 4.5,
         "text": "Phase 1 (Jan-Mar): Market analysis and partner identification. "
                 "Phase 2 (Apr-Jun): Pilot launch in Singapore and Tokyo. "
                 "Phase 3 (Jul-Sep): Full rollout with dedicated sales team.",
         "font_size": 1600, "ph_idx": 1, "ph_type": "body"},
    ],
]

# ============================================================
# BUILD SAMPLE TEMPLATE PPTX (1 placeholder slide)
# ============================================================
template_slides = [
    [
        {"name": "Title", "x": 0.8, "y": 0.4, "w": 8.4, "h": 0.7,
         "text": "Template Title", "font_size": 2400, "bold": True,
         "ph_idx": 0, "ph_type": "title"},
    ],
]

print("Building sample source PPTX (3 slides)...")
build_pptx(samples_dir / "source.pptx", source_slides)
print(f"  -> {samples_dir / 'source.pptx'}")

print("Building sample template PPTX...")
build_pptx(samples_dir / "template.pptx", template_slides)
print(f"  -> {samples_dir / 'template.pptx'}")

# ============================================================
# RUN THE TRANSPILER
# ============================================================
print("\nRunning transpiler...")
from slide_transpiler import transpile

result = transpile(
    samples_dir / "source.pptx",
    samples_dir / "template.pptx",
    samples_dir / "output.pptx",
)

print(f"\nResult: {'PASS' if result.valid else 'FAIL'}")
if result.errors:
    for e in result.errors:
        print(f"  ERROR: {e}")
if result.warnings:
    for w in result.warnings:
        print(f"  WARNING: {w}")

# Show what's inside the output
print(f"\nOutput file: {samples_dir / 'output.pptx'}")
with zipfile.ZipFile(samples_dir / "output.pptx") as zf:
    print("\nOutput PPTX contents:")
    for name in sorted(zf.namelist()):
        info = zf.getinfo(name)
        print(f"  {name:60s} ({info.file_size:>6d} bytes)")

    # Show slide count
    slides = [f for f in zf.namelist()
              if f.startswith("ppt/slides/slide") and f.endswith(".xml") and "/_rels/" not in f]
    print(f"\nSlide count: {len(slides)}")

    # Show content of each slide (text only)
    for slide_path in sorted(slides):
        xml = zf.read(slide_path)
        root = ET.fromstring(xml)
        texts = [t.text for t in root.iter(f"{{{A_NS}}}t") if t.text]
        print(f"\n  {slide_path}:")
        for t in texts:
            print(f"    -> {t}")

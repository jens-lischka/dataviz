"""Tests for the slide extractor module."""

import zipfile

from conftest import make_pptx, make_slide_rels_xml
from slide_transpiler.extractor import count_slides, extract_slide


def test_count_slides():
    buf = make_pptx(slide_count=3)
    with zipfile.ZipFile(buf) as zf:
        assert count_slides(zf) == 3


def test_count_slides_single():
    buf = make_pptx(slide_count=1)
    with zipfile.ZipFile(buf) as zf:
        assert count_slides(zf) == 1


def test_extract_slide_returns_xml():
    buf = make_pptx(slide_count=2)
    with zipfile.ZipFile(buf) as zf:
        pkg = extract_slide(zf, 1)
        assert pkg.slide_xml is not None
        assert pkg.rels_xml is not None
        assert pkg.slide_index == 1


def test_extract_slide_skips_layout_deps():
    """Layout references should not be in dependencies."""
    buf = make_pptx(slide_count=1)
    with zipfile.ZipFile(buf) as zf:
        pkg = extract_slide(zf, 1)
        for dep in pkg.dependencies:
            assert "slideLayout" not in dep


def test_extract_slide_includes_chart_deps():
    """Chart dependencies should be included."""
    def rels_fn(slide_id):
        return make_slide_rels_xml(extra_deps=[
            ("rId2", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart",
             "../charts/chart1.xml"),
        ])

    buf = make_pptx(slide_count=1, slide_rels_fn=rels_fn,
                    extra_files={"ppt/charts/chart1.xml": b"<chart/>"})
    with zipfile.ZipFile(buf) as zf:
        pkg = extract_slide(zf, 1)
        assert "ppt/charts/chart1.xml" in pkg.dependencies

"""Tests for the slide classifier module."""

from conftest import make_slide_xml
from slide_transpiler.classifier import classify_slide


def test_classify_title_slide():
    xml = make_slide_xml(shapes=1)
    assert classify_slide(xml) == "title"


def test_classify_chart_slide():
    xml = make_slide_xml(shapes=2, has_chart=True)
    assert classify_slide(xml) == "chart"


def test_classify_table_slide():
    xml = make_slide_xml(shapes=2, has_table=True)
    assert classify_slide(xml) == "table"


def test_classify_title_content_slide():
    xml = make_slide_xml(shapes=3)
    assert classify_slide(xml) == "title_content"


def test_chart_takes_priority_over_table():
    """If both chart and table exist, classify as chart."""
    xml = make_slide_xml(shapes=2, has_chart=True, has_table=True)
    assert classify_slide(xml) == "chart"

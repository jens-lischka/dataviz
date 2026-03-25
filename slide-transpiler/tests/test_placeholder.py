"""Tests for placeholder rebinding."""

import xml.etree.ElementTree as ET

from conftest import make_slide_xml
from slide_transpiler.namespaces import NS
from slide_transpiler.placeholder import get_placeholder_mapping, remap_placeholders


def test_remap_placeholders():
    xml = make_slide_xml(shapes=2, placeholder_idxs=["0", "1"])
    mapping = {"0": "10", "1": "11"}

    result = remap_placeholders(xml, mapping)
    root = ET.fromstring(result)

    phs = root.findall(".//{%s}ph" % NS["p"])
    idxs = {ph.attrib.get("idx") for ph in phs}
    assert "10" in idxs
    assert "11" in idxs
    assert "0" not in idxs
    assert "1" not in idxs


def test_remap_preserves_unmapped():
    xml = make_slide_xml(shapes=2, placeholder_idxs=["0", "5"])
    mapping = {"0": "10"}  # Only map idx 0

    result = remap_placeholders(xml, mapping)
    root = ET.fromstring(result)

    phs = root.findall(".//{%s}ph" % NS["p"])
    idxs = {ph.attrib.get("idx") for ph in phs}
    assert "10" in idxs
    assert "5" in idxs  # Unmapped, should stay


def test_get_placeholder_mapping_default():
    mapping = get_placeholder_mapping("title")
    assert "0" in mapping


def test_get_placeholder_mapping_custom():
    custom = {"0": "99"}
    mapping = get_placeholder_mapping("title", custom)
    assert mapping == {"0": "99"}

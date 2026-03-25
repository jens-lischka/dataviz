"""Tests for the relationship manager."""

from slide_transpiler.relationships import generate_rid, get_existing_rids
from conftest import make_slide_rels_xml


def test_generate_rid_first():
    assert generate_rid(set()) == "rId1"


def test_generate_rid_skips_existing():
    existing = {"rId1", "rId2", "rId3"}
    assert generate_rid(existing) == "rId4"


def test_generate_rid_fills_gap():
    existing = {"rId1", "rId3"}
    assert generate_rid(existing) == "rId2"


def test_get_existing_rids():
    rels = make_slide_rels_xml(layout_rid="rId1")
    rids = get_existing_rids(rels)
    assert "rId1" in rids

"""Classify slides by content type for layout mapping."""

import xml.etree.ElementTree as ET
from typing import Literal

from .namespaces import NS

SlideType = Literal["title", "chart", "table", "title_content"]


def classify_slide(slide_xml: bytes) -> SlideType:
    """Classify a slide based on its content elements.

    Heuristic classification for v1:
    - Single shape (typically title only) → "title"
    - Contains graphicFrame (chart/diagram) → "chart"
    - Contains table element → "table"
    - Everything else → "title_content"

    Args:
        slide_xml: Raw XML bytes of the slide.

    Returns:
        Classification string.
    """
    root = ET.fromstring(slide_xml)

    # Check for charts (graphicFrame elements)
    graphic_frames = root.findall(".//{%s}graphicFrame" % NS["p"])
    has_chart = len(graphic_frames) > 0

    # Check for tables
    tables = root.findall(".//{%s}tbl" % NS["a"])
    has_table = len(tables) > 0

    # Count regular shapes
    shapes = root.findall(".//{%s}sp" % NS["p"])

    if has_chart:
        return "chart"
    if has_table:
        return "table"
    if len(shapes) <= 1:
        return "title"
    return "title_content"

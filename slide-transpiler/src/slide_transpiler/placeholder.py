"""Placeholder rebinding — adapt source placeholders to target template."""

import xml.etree.ElementTree as ET
from typing import Optional

from .namespaces import NS
from .classifier import SlideType

# Default placeholder mappings per slide type.
# Keys are source idx values, values are target idx values.
# These can be overridden by the user.
DEFAULT_MAPPINGS: dict[SlideType, dict[str, str]] = {
    "title": {
        "0": "0",   # Title placeholder
        "1": "1",   # Subtitle placeholder
    },
    "chart": {
        "0": "0",   # Title
        "1": "1",   # Content / chart area
    },
    "table": {
        "0": "0",   # Title
        "1": "1",   # Content / table area
    },
    "title_content": {
        "0": "0",   # Title
        "1": "1",   # Body / content
        "10": "10", # Footer
        "11": "11", # Date
        "12": "12", # Slide number
    },
}


def get_placeholder_mapping(
    layout_type: SlideType,
    custom_mapping: Optional[dict[str, str]] = None,
) -> dict[str, str]:
    """Get the placeholder index mapping for a slide type.

    Args:
        layout_type: Classified slide type.
        custom_mapping: Optional override mapping.

    Returns:
        Mapping of source idx → target idx.
    """
    if custom_mapping:
        return custom_mapping
    return DEFAULT_MAPPINGS.get(layout_type, {})


def remap_placeholders(
    xml: bytes,
    mapping: dict[str, str],
) -> bytes:
    """Remap placeholder idx attributes in slide XML.

    Only modifies <p:ph idx="X"/> elements. All other XML is preserved as-is.

    Args:
        xml: Slide XML bytes.
        mapping: Source idx → target idx mapping.

    Returns:
        Modified XML bytes with remapped placeholder indices.
    """
    # Register namespaces to preserve prefixes on output
    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)

    root = ET.fromstring(xml)

    # Find all placeholder elements
    for ph in root.iter("{%s}ph" % NS["p"]):
        old_idx = ph.attrib.get("idx")
        if old_idx is not None and old_idx in mapping:
            ph.attrib["idx"] = mapping[old_idx]

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)

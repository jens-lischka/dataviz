"""XML namespace definitions for PresentationML (OOXML)."""

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "ct": "http://schemas.openxmlformats.org/package/2006/content-types",
}

# Relationship type URIs
REL_TYPES = {
    "slide": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
    "slideLayout": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
    "chart": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart",
    "image": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
    "oleObject": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject",
    "package": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package",
}

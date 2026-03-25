"""Slide Transpiler v1 — Convert PPTX slides between templates."""

__version__ = "1.0.0"

from .transpiler import transpile
from .extractor import extract_slide
from .classifier import classify_slide
from .placeholder import remap_placeholders
from .connectors import validate_connectors
from .injector import inject_slide
from .dependencies import copy_dependencies
from .relationships import generate_rid, register_slide

__all__ = [
    "transpile",
    "extract_slide",
    "classify_slide",
    "remap_placeholders",
    "validate_connectors",
    "inject_slide",
    "copy_dependencies",
    "generate_rid",
    "register_slide",
]

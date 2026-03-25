"""Extract slide packages from source PPTX files."""

import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Optional
from zipfile import ZipFile

from .namespaces import NS


@dataclass
class SlidePackage:
    """A self-contained slide with its relationships and dependencies."""

    slide_xml: bytes
    rels_xml: bytes
    dependencies: list[str] = field(default_factory=list)
    slide_index: int = 0


def extract_slide(zipf: ZipFile, slide_id: int) -> SlidePackage:
    """Extract a slide and all its dependencies from a PPTX zip.

    Args:
        zipf: Open ZipFile of the source PPTX.
        slide_id: 1-based slide index.

    Returns:
        SlidePackage containing slide XML, relationships, and dependency paths.
    """
    slide_path = f"ppt/slides/slide{slide_id}.xml"
    rels_path = f"ppt/slides/_rels/slide{slide_id}.xml.rels"

    slide_xml = zipf.read(slide_path)
    rels_xml = zipf.read(rels_path)

    # Parse relationships to find dependencies (charts, media, embeddings)
    root = ET.fromstring(rels_xml)
    deps: list[str] = []

    for rel in root:
        target = rel.attrib.get("Target", "")
        rel_type = rel.attrib.get("Type", "")

        # Skip layout references — those come from the target template
        if "slideLayout" in target or "slideLayout" in rel_type:
            continue

        # Skip slide master references
        if "slideMaster" in target or "slideMaster" in rel_type:
            continue

        # Resolve relative path to absolute within the zip
        if target.startswith("../"):
            resolved = "ppt/" + target.replace("../", "")
        elif not target.startswith("ppt/"):
            resolved = f"ppt/slides/{target}"
        else:
            resolved = target

        deps.append(resolved)

    return SlidePackage(
        slide_xml=slide_xml,
        rels_xml=rels_xml,
        dependencies=deps,
        slide_index=slide_id,
    )


def count_slides(zipf: ZipFile) -> int:
    """Count the number of slides in a PPTX file."""
    count = 0
    for name in zipf.namelist():
        if name.startswith("ppt/slides/slide") and name.endswith(".xml"):
            # Exclude relationship files
            if "/_rels/" not in name:
                count += 1
    return count

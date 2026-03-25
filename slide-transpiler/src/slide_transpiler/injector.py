"""Injector — insert processed slides into the target PPTX."""

from zipfile import ZipFile


def inject_slide(
    out_zip: ZipFile,
    slide_xml: bytes,
    rels_xml: bytes,
    slide_id: int,
) -> None:
    """Write a slide and its relationships into the output PPTX.

    Args:
        out_zip: Output PPTX as open ZipFile (writable).
        slide_xml: Processed slide XML bytes.
        rels_xml: Slide relationship XML bytes.
        slide_id: 1-based slide index for file naming.
    """
    slide_path = f"ppt/slides/slide{slide_id}.xml"
    rels_path = f"ppt/slides/_rels/slide{slide_id}.xml.rels"

    out_zip.writestr(slide_path, slide_xml)
    out_zip.writestr(rels_path, rels_xml)

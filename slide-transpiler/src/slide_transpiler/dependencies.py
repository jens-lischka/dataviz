"""Dependency resolver — copy assets (charts, media, embeddings) between PPTX files."""

import logging
from zipfile import ZipFile

logger = logging.getLogger(__name__)


def copy_dependencies(
    src_zip: ZipFile,
    tgt_zip: ZipFile,
    deps: list[str],
) -> list[str]:
    """Copy dependency files from source to target PPTX.

    Handles charts, embedded Excel files, images, and other assets
    referenced by slide relationships.

    Args:
        src_zip: Source PPTX as open ZipFile.
        tgt_zip: Target PPTX as open ZipFile (must be writable).
        deps: List of internal zip paths to copy.

    Returns:
        List of paths that were successfully copied.
    """
    copied: list[str] = []

    for dep in deps:
        try:
            data = src_zip.read(dep)
            tgt_zip.writestr(dep, data)
            copied.append(dep)
            logger.debug("Copied dependency: %s", dep)
        except KeyError:
            logger.warning("Dependency not found in source: %s", dep)
        except Exception as e:
            logger.error("Failed to copy dependency %s: %s", dep, e)

    return copied

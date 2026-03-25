"""Main transpiler pipeline — orchestrates the full slide conversion."""

import logging
import zipfile
from pathlib import Path
from typing import Optional

from .classifier import classify_slide
from .connectors import validate_connectors
from .dependencies import copy_dependencies
from .extractor import count_slides, extract_slide
from .injector import inject_slide
from .placeholder import get_placeholder_mapping, remap_placeholders
from .relationships import register_slide
from .validator import ValidationResult, validate_output

logger = logging.getLogger(__name__)


def transpile(
    src_file: str | Path,
    template_file: str | Path,
    output_file: str | Path,
    custom_mappings: Optional[dict[str, dict[str, str]]] = None,
    validate: bool = True,
) -> ValidationResult:
    """Transpile all slides from source PPTX into a target template.

    Pipeline:
    1. Copy template as base for output
    2. For each source slide:
       a. Extract slide + dependencies
       b. Classify slide type
       c. Remap placeholders to target template
       d. Validate connectors
       e. Inject into output
       f. Copy dependencies (charts, media, embeddings)
       g. Register slide in presentation manifest

    Args:
        src_file: Path to the source PPTX file.
        template_file: Path to the target template PPTX.
        output_file: Path for the output PPTX.
        custom_mappings: Optional per-slide-type placeholder mappings.
            Keys are slide type strings, values are idx→idx dicts.
        validate: Whether to run validation after transpiling.

    Returns:
        ValidationResult (always returned, check .valid for pass/fail).
    """
    src_file = Path(src_file)
    template_file = Path(template_file)
    output_file = Path(output_file)

    logger.info("Starting transpile: %s → %s (template: %s)", src_file, output_file, template_file)

    src = zipfile.ZipFile(src_file, "r")
    tpl = zipfile.ZipFile(template_file, "r")
    out = zipfile.ZipFile(output_file, "w", zipfile.ZIP_DEFLATED)

    try:
        # Step 1: Copy entire template as the base
        for item in tpl.infolist():
            # Skip existing slides from template (we'll replace with source slides)
            if item.filename.startswith("ppt/slides/slide") and item.filename.endswith(".xml"):
                continue
            if item.filename.startswith("ppt/slides/_rels/slide") and item.filename.endswith(".xml.rels"):
                continue
            out.writestr(item.filename, tpl.read(item.filename))

        logger.info("Template base copied")

        # Step 2: Process each source slide
        slide_count = count_slides(src)
        logger.info("Source contains %d slides", slide_count)

        for i in range(1, slide_count + 1):
            logger.info("Processing slide %d/%d", i, slide_count)

            # 2a. Extract
            pkg = extract_slide(src, i)

            # 2b. Classify
            layout_type = classify_slide(pkg.slide_xml)
            logger.info("  Slide %d classified as: %s", i, layout_type)

            # 2c. Remap placeholders
            custom = None
            if custom_mappings and layout_type in custom_mappings:
                custom = custom_mappings[layout_type]
            mapping = get_placeholder_mapping(layout_type, custom)
            slide_xml = remap_placeholders(pkg.slide_xml, mapping)

            # 2d. Validate connectors
            slide_xml = validate_connectors(slide_xml)

            # 2e. Inject slide
            inject_slide(out, slide_xml, pkg.rels_xml, i)

            # 2f. Copy dependencies
            copied = copy_dependencies(src, out, pkg.dependencies)
            logger.info("  Copied %d dependencies", len(copied))

            # 2g. Register slide
            register_slide(out, i)

        logger.info("All slides processed")

        # Step 3: Validate
        if validate:
            # Reopen for reading
            out.close()
            with zipfile.ZipFile(output_file, "r") as check:
                result = validate_output(check, slide_count)

            if result.valid:
                logger.info("Output validation PASSED")
            else:
                logger.error("Output validation FAILED:")
                for err in result.errors:
                    logger.error("  ERROR: %s", err)
                for warn in result.warnings:
                    logger.warning("  WARNING: %s", warn)

            return result
        else:
            out.close()
            return ValidationResult()

    except Exception:
        out.close()
        raise
    finally:
        src.close()
        tpl.close()

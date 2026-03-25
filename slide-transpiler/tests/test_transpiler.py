"""Integration tests for the full transpile pipeline."""

import zipfile
from pathlib import Path

from slide_transpiler.transpiler import transpile


def test_transpile_preserves_slide_count(simple_source: Path, simple_template: Path, output_path: Path):
    result = transpile(simple_source, simple_template, output_path)
    assert result.valid

    with zipfile.ZipFile(output_path) as zf:
        slide_files = [
            f for f in zf.namelist()
            if f.startswith("ppt/slides/slide") and f.endswith(".xml") and "/_rels/" not in f
        ]
        assert len(slide_files) == 2


def test_transpile_output_is_valid_zip(simple_source: Path, simple_template: Path, output_path: Path):
    transpile(simple_source, simple_template, output_path)
    assert output_path.exists()

    with zipfile.ZipFile(output_path) as zf:
        # Should be a valid zip
        assert zf.testzip() is None


def test_transpile_contains_content_types(simple_source: Path, simple_template: Path, output_path: Path):
    transpile(simple_source, simple_template, output_path)

    with zipfile.ZipFile(output_path) as zf:
        assert "[Content_Types].xml" in zf.namelist()


def test_transpile_no_validate(simple_source: Path, simple_template: Path, output_path: Path):
    result = transpile(simple_source, simple_template, output_path, validate=False)
    assert result.valid  # Default result is valid when skipping validation
    assert output_path.exists()

# Slide Transpiler v1

A deterministic system that converts PresentationML structures between PowerPoint templates by cloning, rebinding, and injecting slide packages.

## How It Works

The transpiler operates at the XML level inside `.pptx` files (which are ZIP archives). It:

1. **Extracts** slides + relationships + dependencies from a source PPTX
2. **Classifies** each slide by content type (title, chart, table, content)
3. **Remaps** placeholder indices to match the target template
4. **Validates** connector shapes for structural integrity
5. **Injects** processed slides into the target template
6. **Copies** all dependencies (charts, media, embeddings)
7. **Registers** slides in the presentation manifest

**Key principle:** Slides are *transpiled*, not regenerated. No content is reinterpreted or rebuilt — only XML is copied, rebound, and injected.

## Usage

### CLI

```bash
python -m slide_transpiler source.pptx template.pptx output.pptx
python -m slide_transpiler source.pptx template.pptx output.pptx -v  # verbose
```

### Python API

```python
from slide_transpiler import transpile

result = transpile("source.pptx", "template.pptx", "output.pptx")

if result.valid:
    print("Success!")
else:
    for error in result.errors:
        print(f"Error: {error}")
```

### Custom Placeholder Mappings

```python
result = transpile(
    "source.pptx",
    "template.pptx",
    "output.pptx",
    custom_mappings={
        "title": {"0": "0", "1": "1"},
        "chart": {"0": "0", "1": "2"},
    },
)
```

## Project Structure

```
src/slide_transpiler/
├── __init__.py          # Public API
├── __main__.py          # CLI entry point
├── namespaces.py        # XML namespace definitions
├── extractor.py         # Extract slide packages from source
├── classifier.py        # Classify slides by content type
├── placeholder.py       # Remap placeholder indices
├── connectors.py        # Validate connector shapes
├── dependencies.py      # Copy assets between PPTX files
├── injector.py          # Insert slides into target
├── relationships.py     # Manage rId references and registration
├── validator.py         # Structural validation of output
└── transpiler.py        # Main pipeline orchestrator
```

## Running Tests

```bash
cd slide-transpiler
pip install -e ".[dev]"
pytest -v
```

## Limitations (v1)

- Layout mapping is heuristic (classifies by content type, not semantic analysis)
- No chart transformation (charts are cloned as-is)
- No component system
- Placeholder mappings are static per slide type

## Requirements

- Python >= 3.10
- No external dependencies (uses only stdlib `xml.etree.ElementTree` and `zipfile`)

"""CLI entry point for the Slide Transpiler."""

import argparse
import logging
import sys

from .transpiler import transpile


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Slide Transpiler v1 — Convert PPTX slides between templates",
    )
    parser.add_argument("source", help="Path to source PPTX file")
    parser.add_argument("template", help="Path to target template PPTX file")
    parser.add_argument("output", help="Path for output PPTX file")
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )
    parser.add_argument(
        "--no-validate",
        action="store_true",
        help="Skip output validation",
    )

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    result = transpile(
        src_file=args.source,
        template_file=args.template,
        output_file=args.output,
        validate=not args.no_validate,
    )

    if result.valid:
        print(f"Success: Output written to {args.output}")
        if result.warnings:
            for w in result.warnings:
                print(f"  WARNING: {w}")
        return 0
    else:
        print("FAILED: Output may be invalid")
        for e in result.errors:
            print(f"  ERROR: {e}")
        for w in result.warnings:
            print(f"  WARNING: {w}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

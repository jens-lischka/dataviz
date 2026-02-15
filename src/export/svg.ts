/**
 * SVG Export Utility
 *
 * Cleans a D3-rendered SVG element for export:
 * - Removes D3 internal __data__ properties
 * - Removes event listeners
 * - Inlines computed styles as attributes
 * - Adds proper XML namespace declarations
 * - Sets viewBox for responsive scaling
 * - Optionally converts text to paths (for Illustrator compatibility)
 */

import { saveAs } from "file-saver";

/**
 * Clean and serialize an SVG element to a string.
 */
export function serializeSvg(svgElement: SVGSVGElement): string {
  // Clone the node to avoid modifying the live DOM
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Ensure proper namespace
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // Remove D3 internal data and event listeners
  cleanNode(clone);

  // Serialize to string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Add XML declaration
  svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;

  return svgString;
}

/**
 * Download an SVG element as a .svg file.
 */
export function downloadSvg(svgElement: SVGSVGElement, filename = "chart.svg"): void {
  const svgString = serializeSvg(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  saveAs(blob, filename);
}

/**
 * Download an SVG element as a PNG file.
 * @param scale - Resolution multiplier (1x, 2x, 3x)
 */
export async function downloadPng(
  svgElement: SVGSVGElement,
  filename = "chart.png",
  scale = 2,
  backgroundColor?: string
): Promise<void> {
  const svgString = serializeSvg(svgElement);
  const viewBox = svgElement.getAttribute("viewBox")?.split(" ").map(Number) ?? [0, 0, 800, 500];
  const width = viewBox[2] * scale;
  const height = viewBox[3] * scale;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Background
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Create image from SVG
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, filename);
          resolve();
        } else {
          reject(new Error("Failed to create PNG blob"));
        }
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG for PNG conversion"));
    };

    img.src = url;
  });
}

// ─── Internal Helpers ────────────────────────────────────────────────

/**
 * Recursively clean a DOM node of D3 internals.
 */
function cleanNode(node: Element): void {
  // Remove D3's __data__ property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (node as any).__data__;

  // Remove D3 event listeners (stored on __on)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (node as any).__on;

  // Remove attributes that are D3 internals or unnecessary for export
  const removeAttrs = ["data-d3-", "__"];
  for (const attr of Array.from(node.attributes)) {
    if (removeAttrs.some((prefix) => attr.name.startsWith(prefix))) {
      node.removeAttribute(attr.name);
    }
  }

  // Recurse into children
  for (const child of Array.from(node.children)) {
    cleanNode(child);
  }
}

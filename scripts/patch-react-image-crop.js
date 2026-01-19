#!/usr/bin/env node
/**
 * Patch react-image-crop to fix CSS import issues in Node.js ESM
 *
 * This script replaces the CSS file content with a JS module stub.
 * Node.js ESM will execute the JS code instead of failing on the .css extension.
 * Webpack/browser bundling gets the CSS through @payloadcms/next/css.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const cssPath = path.join(
  projectRoot,
  "node_modules/react-image-crop/dist/ReactCrop.css",
);

// Check if already patched
const cssContent = fs.existsSync(cssPath)
  ? fs.readFileSync(cssPath, "utf-8")
  : "";
if (cssContent.includes("Auto-generated stub")) {
  console.log("[patch-react-image-crop] Already patched, skipping");
  process.exit(0);
}

// Check if the CSS file exists
if (!fs.existsSync(cssPath)) {
  console.log("[patch-react-image-crop] CSS file not found, skipping patch");
  process.exit(0);
}

// The stub content - a valid JS module that Node.js ESM can execute
const stubContent = `// Auto-generated stub for Node.js ESM compatibility
// The actual CSS styles are bundled by @payloadcms/next/css for the browser
export default {};
`;

try {
  // Simply replace the CSS file content with the JS stub
  // Node.js ESM will execute this as JavaScript even though it has a .css extension
  // because the package.json has "type": "module"
  fs.writeFileSync(cssPath, stubContent);
  console.log("[patch-react-image-crop] Replaced CSS with JS stub at", cssPath);
  console.log("[patch-react-image-crop] Patch complete");
} catch (error) {
  console.error("[patch-react-image-crop] Error:", error.message);
  process.exit(1);
}

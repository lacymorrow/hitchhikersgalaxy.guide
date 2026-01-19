#!/usr/bin/env node
/**
 * Patch react-image-crop to fix CSS import issues in Node.js ESM
 *
 * This script creates a .mjs file alongside the CSS file that exports an empty object,
 * allowing Node.js to import it without errors while keeping the CSS for browser bundling.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const cssPath = path.join(projectRoot, 'node_modules/react-image-crop/dist/ReactCrop.css');
const mjsPath = path.join(projectRoot, 'node_modules/react-image-crop/dist/ReactCrop.css.mjs');

// Check if the CSS file exists
if (!fs.existsSync(cssPath)) {
  console.log('[patch-react-image-crop] CSS file not found, skipping patch');
  process.exit(0);
}

// Create a .mjs stub file
const stubContent = `// Auto-generated stub for Node.js ESM compatibility
// The actual CSS is bundled by webpack for the browser
export default {};
`;

try {
  fs.writeFileSync(mjsPath, stubContent);
  console.log('[patch-react-image-crop] Created CSS stub at', mjsPath);

  // Also update the package.json exports to prefer .mjs for Node.js
  const pkgPath = path.join(projectRoot, 'node_modules/react-image-crop/package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  if (pkg.exports && pkg.exports['./dist/ReactCrop.css']) {
    pkg.exports['./dist/ReactCrop.css'] = {
      node: './dist/ReactCrop.css.mjs',
      default: './dist/ReactCrop.css'
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('[patch-react-image-crop] Updated package.json exports');
  }
} catch (error) {
  console.error('[patch-react-image-crop] Error:', error.message);
  process.exit(1);
}

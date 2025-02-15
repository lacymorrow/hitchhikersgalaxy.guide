#!/usr/bin/env node

import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { generateRegistry } from "./generate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMPONENTS_DIR = join(__dirname, "src");
const OUTPUT_DIR = join(__dirname, "r");

// Ensure output directory exists
await mkdir(OUTPUT_DIR, { recursive: true });

generateRegistry(COMPONENTS_DIR, OUTPUT_DIR);

#!/usr/bin/env ts-node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();

function runCommand(command: string) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
  }
}

function removeDirectory(dir: string) {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing directory: ${fullPath}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

function removeFile(file: string) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing file: ${fullPath}`);
    fs.unlinkSync(fullPath);
  }
}

console.log("Starting cleanup process...");

// Stop any running processes
// runCommand('pkill -f "next dev"');

// Remove default problematic directories and files
const defaultDirs = ["node_modules", ".next", ".turbo"];
const defaultFiles = ["pnpm-lock.yaml"];

// Get additional folders to remove from command-line arguments
const additionalFolders = process.argv.slice(2);
if (additionalFolders.length === 0) {
  defaultDirs.forEach(removeDirectory);
  defaultFiles.forEach(removeFile);
  runCommand("npm cache clean --force");
} else if (process.argv.includes("--next")) {
  removeDirectory(".next");
} else {
  // Args are folders to remove
  [...defaultDirs, ...additionalFolders].forEach(removeDirectory);
}

// Clear npm cache

console.log("Cleanup process completed.");

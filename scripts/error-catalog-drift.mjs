#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const errorCatalogPath = path.resolve(process.cwd(), 'handbook/70-contracts/errors.md');

if (!fs.existsSync(errorCatalogPath)) {
  console.error(`Error: Error catalog file not found at ${errorCatalogPath}`);
  process.exit(1);
}

const catalogContent = fs.readFileSync(errorCatalogPath, 'utf8');

// Scan codebase for code = '...' error codes
const codeFiles = [
  'apps/api/src/kernel/authorization.ts',
  'apps/api/src/kernel/quota-service.ts',
];

let allValid = true;

for (const relPath of codeFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;

  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const matches = fileContent.matchAll(/readonly\s+code\s*=\s*['"]([^'"]+)['"]/g);

  for (const match of matches) {
    const code = match[1];
    if (!catalogContent.includes(code)) {
      console.error(`Error: Error code "${code}" found in ${relPath} but missing from errors.md`);
      allValid = false;
    }
  }
}

if (!allValid) {
  process.exit(1);
}

console.log('✓ Error catalog validated: all thrown error codes match errors.md');

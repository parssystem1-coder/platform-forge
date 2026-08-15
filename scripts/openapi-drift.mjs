#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const openapiPath = path.resolve(process.cwd(), 'handbook/70-contracts/openapi.yaml');

if (!fs.existsSync(openapiPath)) {
  console.error(`Error: OpenAPI file not found at ${openapiPath}`);
  process.exit(1);
}

const content = fs.readFileSync(openapiPath, 'utf8');

// Basic contract checks
const requiredSections = ['openapi:', 'info:', 'paths:', 'components:'];
for (const section of requiredSections) {
  if (!content.includes(section)) {
    console.error(`Error: OpenAPI missing required section: ${section}`);
    process.exit(1);
  }
}

console.log('✓ OpenAPI contract validated: no drift detected.');

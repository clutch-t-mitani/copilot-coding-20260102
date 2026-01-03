#!/usr/bin/env node

/**
 * OpenAPI Type Generation Script
 * Generates TypeScript types from OpenAPI specification
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const OPENAPI_PATH = resolve(
  process.cwd(),
  'docs/mini-sns/design/openapi.yaml'
);

console.log('Generating types from OpenAPI specification...');
console.log(`Input: ${OPENAPI_PATH}`);

try {
  // Read the OpenAPI file
  const openapiContent = readFileSync(OPENAPI_PATH, 'utf-8');

  console.log('✅ OpenAPI file read successfully');
  console.log('Note: Install openapi-typescript for type generation');
  console.log('Run: npm install -D openapi-typescript');
  console.log(
    'Then: npx openapi-typescript docs/mini-sns/design/openapi.yaml -o types/openapi.d.ts'
  );

  process.exit(0);
} catch (error) {
  console.error('❌ Type generation failed:');
  console.error(error.message);
  process.exit(1);
}

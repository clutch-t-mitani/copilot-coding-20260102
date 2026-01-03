#!/usr/bin/env node

/**
 * OpenAPI Validation Script
 * Validates the OpenAPI specification file
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const OPENAPI_PATH = resolve(
  process.cwd(),
  'docs/mini-sns/design/openapi.yaml'
);

console.log('Validating OpenAPI specification...');
console.log(`File: ${OPENAPI_PATH}`);

try {
  // Read the OpenAPI file
  const openapiContent = readFileSync(OPENAPI_PATH, 'utf-8');

  // Basic validation - check if file exists and is not empty
  if (!openapiContent || openapiContent.trim().length === 0) {
    throw new Error('OpenAPI file is empty');
  }

  // Check for basic OpenAPI structure
  if (!openapiContent.includes('openapi:')) {
    throw new Error('Invalid OpenAPI file - missing openapi version');
  }

  if (!openapiContent.includes('paths:')) {
    throw new Error('Invalid OpenAPI file - missing paths');
  }

  console.log('✅ OpenAPI validation passed');
  console.log('Note: Install @apidevtools/swagger-parser for full validation');
  process.exit(0);
} catch (error) {
  console.error('❌ OpenAPI validation failed:');
  console.error(error.message);
  process.exit(1);
}

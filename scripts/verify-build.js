#!/usr/bin/env node

const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

const requiredFiles = [
  'index.cjs',
  'index.cjs.map',
  'index.mjs',
  'index.mjs.map',
  'index.d.cts',
  'index.d.cts.map',
  'index.d.mts',
  'index.d.mts.map',
];

const requiredExports = [
  'APIError',
  'SDKError',
  'ValidationError',
  'TravelSDKClient',
  'createTravelSDK',
  'ERROR_CODES',
  'ERROR_CATEGORIES',
  'getErrorCode',
  'isRetryableError',
  'getCanonicalErrorCode',
];

console.log('Verifying build...\n');

if (!existsSync(distDir)) {
  console.error('dist/ directory does not exist. Run: npm run build');
  process.exit(1);
}

console.log('Checking required files...');
let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = join(distDir, file);
  if (existsSync(filePath)) {
    console.log(` ${file}`);
  } else {
    console.error(`${file} is missing`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\nSome required files are missing. Run: npm run build');
  process.exit(1);
}

console.log('\nChecking exports in type definitions...');
const dtsPath = join(distDir, 'index.d.cts');
if (existsSync(dtsPath)) {
  const dtsContent = readFileSync(dtsPath, 'utf-8');
  let allExportsFound = true;

  for (const exportName of requiredExports) {
    const patterns = [
      new RegExp(`export\\s+(class|function|const|type|interface)\\s+${exportName}`, 'g'),
      new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b`, 'g'),
    ];

    const found = patterns.some((pattern) => pattern.test(dtsContent));

    if (found) {
      console.log(`${exportName}`);
    } else {
      console.error(` ${exportName} not found in exports`);
      allExportsFound = false;
    }
  }

  if (!allExportsFound) {
    console.error('\nSome required exports are missing. Rebuild: npm run build');
    process.exit(1);
  }
} else {
  console.error('Type definition file not found');
  process.exit(1);
}

console.log('\nChecking error code exports...');
const errorCodeChecks = [
  'ErrorCode',
  'ErrorCodeDefinition',
  'ErrorCategory',
  'ErrorResponse',
  'getErrorCodesByStatus',
  'getErrorCodesByCategory',
];

const dtsContent = readFileSync(dtsPath, 'utf-8');
let errorCodesFound = true;
for (const check of errorCodeChecks) {
  const found = dtsContent.includes(check);
  if (found) {
    console.log(`${check}`);
  } else {
    console.error(`${check} not found`);
    errorCodesFound = false;
  }
}

if (!errorCodesFound) {
  console.error('\nSome error code exports are missing');
  process.exit(1);
}

console.log('\nBuild verification complete! All files and exports are present.');
console.log('Ready to publish!');

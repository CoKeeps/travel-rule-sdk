#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist', 'index.js');
if (fs.existsSync(distPath)) {
  console.log('travel-sdk: dist directory already exists, skipping build');
  process.exit(0);
}

try {
  require.resolve('typescript');
  console.log('travel-sdk: Building package...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('travel-sdk: Build completed successfully');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('typescript')) {
    console.warn('travel-sdk: Warning - TypeScript not found. The package needs to be built.');
    console.warn('travel-sdk: Please run: npm install (with devDependencies) or npm run build manually');
    console.warn('travel-sdk: Installation will continue, but the package may not work until built.');
  } else {
    console.error('travel-sdk: Build failed:', error.message);
    console.warn('travel-sdk: You may need to run "npm run build" manually');
  }

  process.exit(0);
}


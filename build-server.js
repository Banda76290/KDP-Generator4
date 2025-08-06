#!/usr/bin/env node

// Build script to compile server TypeScript to JavaScript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Building server for production...');

try {
  // Create dist directory if it doesn't exist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Compile TypeScript to JavaScript using esbuild
  console.log('Compiling TypeScript server...');
  execSync('npx esbuild server/index.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --external:./node_modules/* --format=cjs', {
    stdio: 'inherit'
  });

  console.log('✅ Server build complete!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
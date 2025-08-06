#!/usr/bin/env node

// Simple production runner using require
const { execSync } = require('child_process');

console.log('🚀 Starting KDP Generator in production mode...');
process.env.NODE_ENV = 'production';

try {
  // Use tsx from node_modules directly
  execSync('./node_modules/.bin/tsx server/index.ts', {
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('Server crashed:', error.message);
  process.exit(1);
}
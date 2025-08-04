#!/usr/bin/env node

// Development server wrapper to handle tsx execution
const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.NODE_ENV = 'development';

// Run tsx with npx to ensure it's available
const serverPath = path.join(__dirname, 'server', 'index.ts');
const child = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: process.env
});

child.on('error', (error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
#!/usr/bin/env node

// Production startup script for KDP Generator
// This file uses .cjs extension to allow require() in an ES module project

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting KDP Generator in production mode...');

// Set production environment
process.env.NODE_ENV = 'production';

// Construct path to tsx in node_modules
const tsxPath = path.join(__dirname, 'node_modules', '.bin', 'tsx');

console.log('Using tsx from:', tsxPath);

// Start the server using tsx
const serverProcess = spawn(tsxPath, ['server/index.ts'], {
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  // Fallback to npx if direct path fails
  console.log('Trying with npx...');
  const npxProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
  
  npxProcess.on('error', (npxErr) => {
    console.error('Failed with npx too:', npxErr);
    process.exit(1);
  });
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});
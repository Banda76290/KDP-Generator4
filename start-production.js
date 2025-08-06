#!/usr/bin/env node

// Production startup script for KDP Generator
// This script ensures tsx is properly loaded and available

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting KDP Generator in production mode...');

// Set production environment
process.env.NODE_ENV = 'production';

// Start the server using npx to ensure tsx is found
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
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
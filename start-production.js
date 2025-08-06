#!/usr/bin/env node

// Production startup script for KDP Generator
// This script ensures tsx is available in production

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting KDP Generator in production mode...');

// Set production environment
process.env.NODE_ENV = 'production';

// Try to find tsx in node_modules
const tsxPath = join(__dirname, 'node_modules', '.bin', 'tsx');

// Start the server using the local tsx installation
const serverProcess = spawn(tsxPath, ['server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  shell: false
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
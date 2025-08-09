#!/usr/bin/env node

/**
 * This script runs the development server using npx tsx since tsx is not properly installed in the local environment
 */
import { spawn } from 'child_process';

console.log('Starting KDP Generator server...');

// Use npx to run tsx with the TypeScript file
const child = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

child.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  child.kill('SIGTERM');
});
#!/usr/bin/env node

// Simple approach - register ts-node/esm loader
import { register } from 'module';
import { pathToFileURL } from 'url';

// Register ts-node/esm loader
register('ts-node/esm', pathToFileURL('./'));

// Set environment
process.env.NODE_ENV = 'development';

// Import and run the server
try {
  await import('./server/index.ts');
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
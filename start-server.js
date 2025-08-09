#!/usr/bin/env node
// Direct server startup script to bypass tsx runtime issues
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import and start the compiled server
import('./dist/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
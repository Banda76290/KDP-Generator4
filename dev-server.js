#!/usr/bin/env node

// Simple development server script to work around tsx dependency issue
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting KDP Generator development server...');

// Function to build and run the server
function buildAndRun() {
  console.log('📦 Building application...');
  
  const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build completed successfully');
      console.log('🌟 Starting server...');
      
      // Set environment variable and run the built server
      const serverProcess = spawn('node', ['dist/index.js'], { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });
      
      serverProcess.on('close', (serverCode) => {
        console.log(`Server exited with code ${serverCode}`);
      });
      
      serverProcess.on('error', (err) => {
        console.error('Server error:', err);
      });
      
    } else {
      console.error(`❌ Build failed with code ${code}`);
      process.exit(1);
    }
  });
  
  buildProcess.on('error', (err) => {
    console.error('Build error:', err);
    process.exit(1);
  });
}

// Start the build and run process
buildAndRun();
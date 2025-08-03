#!/usr/bin/env node
// Script to prepare deployment files after build
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, '..', 'dist', 'public');
const targetDir = path.resolve(__dirname, '..', 'server', 'public');

console.log('🚀 Preparing deployment files...');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy files recursively
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    for (const item of items) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // Clean target directory first
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });
  
  // Copy files
  copyRecursive(sourceDir, targetDir);
  
  console.log('✅ Deployment files prepared successfully!');
  console.log(`📁 Files copied from ${sourceDir} to ${targetDir}`);
  
  // List files for verification
  const files = fs.readdirSync(targetDir);
  console.log('📋 Files prepared:', files);
  
} catch (error) {
  console.error('❌ Error preparing deployment files:', error.message);
  process.exit(1);
}
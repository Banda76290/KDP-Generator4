#!/usr/bin/env node

import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dist directory exists
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy index.html to dist
const indexHtmlSource = path.resolve(__dirname, 'client/index.html');
const indexHtmlDest = path.resolve(__dirname, 'dist/index.html');

if (fs.existsSync(indexHtmlSource)) {
  let htmlContent = fs.readFileSync(indexHtmlSource, 'utf8');
  // Update script src to point to bundled JS and add CSS link
  htmlContent = htmlContent.replace(
    /src=".*\/main\.tsx"/,
    'src="/assets/main.js"'
  );
  // Add CSS link before closing head tag
  htmlContent = htmlContent.replace(
    '</head>',
    '    <link rel="stylesheet" href="/assets/main.css">\n  </head>'
  );
  fs.writeFileSync(indexHtmlDest, htmlContent);
  console.log('✓ Copied index.html to dist/');
}

// Ensure assets directory exists
const assetsDir = path.resolve(__dirname, 'dist/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function build() {
  try {
    console.log('🚀 Building frontend with esbuild...');
    
    await esbuild.build({
      entryPoints: ['client/src/main.tsx'],
      bundle: true,
      outfile: 'dist/assets/main.js',
      format: 'iife',
      target: 'es2020',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'tsx',
        '.jsx': 'jsx',
        '.js': 'jsx',
        '.css': 'css',
        '.png': 'file',
        '.jpg': 'file',
        '.jpeg': 'file',
        '.svg': 'file',
        '.gif': 'file',
      },
      define: {
        'process.env.NODE_ENV': '"development"',
        'import.meta.env.MODE': '"development"',
        'import.meta.env.DEV': 'true',
        'import.meta.env.PROD': 'false',
      },
      jsx: 'automatic',
      jsxImportSource: 'react',
      external: [],
      alias: {
        '@assets': path.resolve(__dirname, 'attached_assets'),
        '@': path.resolve(__dirname, 'client/src'),
      },
      minify: false,
      sourcemap: true,
      write: true,
      assetNames: 'assets/[name]-[hash]',
      publicPath: '/',
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'],
    });
    
    console.log('✓ Frontend build completed successfully!');
    
    // Create a simple CSS file if it doesn't exist
    const cssPath = path.resolve(__dirname, 'dist/assets/style.css');
    if (!fs.existsSync(cssPath)) {
      fs.writeFileSync(cssPath, `
/* Basic styles for KDP Generator */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f8fafc;
}

#root {
  min-height: 100vh;
}
      `);
      console.log('✓ Created basic CSS file');
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
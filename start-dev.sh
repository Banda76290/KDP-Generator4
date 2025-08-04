#!/bin/bash

echo "🚀 Starting KDP Generator development server..."

# Build the application first
echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
    echo "🌟 Starting development server..."
    
    # Run in development mode
    NODE_ENV=development node dist/index.js
else
    echo "❌ Build failed"
    exit 1
fi
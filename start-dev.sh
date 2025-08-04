#!/bin/bash

echo "🚀 Starting KDP Generator development server..."

# Use npx tsx directly for development
echo "🌟 Starting development server with tsx..."
NODE_ENV=development npx tsx server/index.ts
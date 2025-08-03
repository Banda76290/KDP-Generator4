#!/bin/bash
# Post-build script to prepare deployment files

echo "Copying built files to server/public for deployment..."

# Create the server/public directory if it doesn't exist
mkdir -p server/public

# Copy built files from dist/public to server/public
cp -r dist/public/* server/public/

echo "✅ Deployment files prepared successfully!"
echo "📁 Files copied to server/public/"
ls -la server/public/
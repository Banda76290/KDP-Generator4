#!/bin/bash

# KDP Generator Deployment Script
# This script handles safe deployment with database operation management

echo "🚀 Starting KDP Generator deployment..."

# Set deployment environment variables
export REPLIT_BUILD=true
export NODE_ENV=production

echo "📋 Environment configured for deployment:"
echo "   - REPLIT_BUILD: $REPLIT_BUILD"
echo "   - NODE_ENV: $NODE_ENV"

# Build the application with deployment-safe configuration
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
    
    # The application is now ready for deployment
    echo "📦 Application ready for Cloud Run deployment"
    echo "💡 After deployment completes, set REPLIT_DEPLOYMENT_COMPLETE=true to enable full functionality"
    
else
    echo "❌ Build failed"
    exit 1
fi

echo "🎉 Deployment preparation complete!"
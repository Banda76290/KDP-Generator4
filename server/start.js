// Simple Node.js starter for development with tsx loader
import { register } from 'tsx/esm/api'

// Register tsx for .ts file support
register()

// Set development environment  
process.env.NODE_ENV = 'development'

// Import and start the TypeScript server
async function start() {
  try {
    console.log('Starting development server...')
    await import('./index.ts')
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
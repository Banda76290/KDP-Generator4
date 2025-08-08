import { register } from 'tsx/esm';
register();

// Set environment
process.env.NODE_ENV = 'development';

// Import and start the server
import('./index.ts');
// Minimal server starter that bypasses npm entirely
process.env.NODE_ENV = 'production';
require('./dist/index.js');
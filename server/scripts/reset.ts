#!/usr/bin/env tsx
/**
 * Database reset and re-seeding script
 * Usage: tsx server/scripts/reset.ts
 */

import { forceSeedDatabase } from '../seedDatabase.js';

console.log('🔄 Database reset and re-seeding started...');

forceSeedDatabase()
  .then(() => {
    console.log('✅ Database reset and re-seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  });
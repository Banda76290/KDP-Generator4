#!/usr/bin/env tsx
/**
 * Manual database seeding script
 * Usage: tsx server/scripts/seed.ts
 */

import { seedDatabase } from '../seedDatabase.js';

console.log('🌱 Manual database seeding started...');

seedDatabase()
  .then(() => {
    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  });
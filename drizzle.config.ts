// drizzle.config.ts — version autonome sans import
const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL manquant pour drizzle-kit');
}

export default {
  out: './migrations',
  schema: './shared/schema.ts', // adapte si ton chemin diffère
  dialect: 'postgresql',
  dbCredentials: { url: DATABASE_URL },
  // migrations: { table: '__drizzle_migrations', schema: 'drizzle' }, // optionnel
};

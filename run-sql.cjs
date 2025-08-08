const fs = require('fs');
const { Client } = require('pg');

(async () => {
  const file = process.argv[2];
  if (!file) { console.error('Usage : node run-sql.cjs <fichier.sql>'); process.exit(1); }

  const sql = fs.readFileSync(file, 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Fichier exécuté :', file);
  } catch (e) {
    console.error('❌ Erreur SQL :', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

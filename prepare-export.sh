#!/bin/bash

echo "🚀 Préparation de l'export pour déploiement externe..."

# Créer un dossier d'export
mkdir -p export-ready

# Copier les fichiers essentiels
cp -r client export-ready/
cp -r server export-ready/
cp -r shared export-ready/
cp -r migrations export-ready/
cp package.json export-ready/
cp package-lock.json export-ready/
cp tsconfig.json export-ready/
cp vite.config.ts export-ready/
cp drizzle.config.ts export-ready/
cp postcss.config.js export-ready/
cp tailwind.config.ts export-ready/
cp components.json export-ready/

# Créer un fichier .env.example
cat > export-ready/.env.example << EOF
# Database
DATABASE_URL=your_postgresql_connection_string

# Authentication  
SESSION_SECRET=your_session_secret_here
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.com
REPL_ID=your-app-id

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=your_stripe_key_here

# Environment
NODE_ENV=production
PORT=3000
EOF

# Créer un README pour le déploiement
cat > export-ready/DEPLOYMENT.md << EOF
# Guide de Déploiement KDP Generator

## Prérequis
- Node.js 20+
- PostgreSQL database
- Compte OpenAI (pour l'IA)

## Installation

1. Installer les dépendances :
\`\`\`bash
npm install
\`\`\`

2. Configurer les variables d'environnement :
   - Copier \`.env.example\` vers \`.env\`
   - Remplir toutes les valeurs

3. Initialiser la base de données :
\`\`\`bash
npm run db:push
\`\`\`

4. Build de production :
\`\`\`bash
npm run build
\`\`\`

5. Démarrer l'application :
\`\`\`bash
npm run start
\`\`\`

## Services de déploiement recommandés

### Vercel
- Excellent pour les applications React/Next.js
- Base de données PostgreSQL incluse
- Déploiement automatique depuis GitHub

### Railway
- Support complet Node.js + PostgreSQL
- Variables d'environnement faciles
- Déploiement depuis GitHub

### Render
- Gratuit pour commencer
- PostgreSQL gratuit inclus
- SSL automatique

### Fly.io
- Performant et global
- PostgreSQL disponible
- Bonne option pour production

### DigitalOcean App Platform
- Simple et fiable
- Managed PostgreSQL disponible
- Scaling automatique
EOF

echo "✅ Export préparé dans le dossier 'export-ready'"
echo "📦 Pour créer un ZIP : zip -r kdp-generator-export.zip export-ready/"
# 📦 Guide de Déploiement Externe - KDP Generator

## Comment exporter votre projet depuis Replit

### Option 1 : Téléchargement direct
1. Dans Replit, cliquez sur les 3 points (...) en haut
2. Sélectionnez "Download as zip"
3. Votre projet sera téléchargé sur votre ordinateur

### Option 2 : Via GitHub
1. Connectez votre Replit à GitHub
2. Faites un push vers votre repository
3. Clonez le repository sur votre machine locale

## 🚀 Services de Déploiement Recommandés

### 1. **Railway (Recommandé pour facilité)**
```bash
# Installation Railway CLI
npm install -g @railway/cli

# Connexion
railway login

# Déploiement
railway up
```

**Avantages :**
- PostgreSQL inclus gratuitement
- Variables d'environnement simples
- Déploiement en 1 commande
- 5$ de crédit gratuit/mois

### 2. **Vercel + Supabase**
```bash
# Installation Vercel CLI
npm install -g vercel

# Déploiement
vercel
```

**Configuration Vercel :**
- Framework : Vite
- Build Command : `npm run build`
- Output Directory : `dist/public`
- Install Command : `npm install`

**Base de données Supabase :**
1. Créer compte sur supabase.com
2. Créer nouveau projet
3. Copier l'URL PostgreSQL
4. Mettre dans DATABASE_URL

### 3. **Render (100% Gratuit)**
1. Créer compte sur render.com
2. Nouveau Web Service
3. Connecter GitHub repo
4. Configuration :
   - Build Command : `npm run build`
   - Start Command : `npm run start`
   - Environment : Node
5. Ajouter PostgreSQL gratuit

### 4. **Fly.io (Performance)**
```bash
# Installation
curl -L https://fly.io/install.sh | sh

# Initialisation
fly launch

# Déploiement
fly deploy
```

### 5. **DigitalOcean App Platform**
1. Créer compte DigitalOcean
2. Apps > Create App
3. Connecter GitHub
4. Ajouter Database Component
5. Déployer

## 🔧 Configuration Requise

### Variables d'Environnement Essentielles
```env
# Base de données (obligatoire)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Session (obligatoire)
SESSION_SECRET=generate-random-32-chars-minimum

# OpenAI (pour l'IA)
OPENAI_API_KEY=sk-...

# Stripe (optionnel)
STRIPE_SECRET_KEY=sk_...

# Production
NODE_ENV=production
PORT=3000
```

### Commandes de Build
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "db:push": "drizzle-kit push"
  }
}
```

## 📝 Étapes de Déploiement

1. **Exporter le code** depuis Replit
2. **Choisir un service** de déploiement
3. **Créer une base PostgreSQL**
4. **Configurer les variables** d'environnement
5. **Déployer** avec les commandes du service
6. **Initialiser la DB** avec `npm run db:push`

## 💡 Conseils

- **Railway** est le plus simple pour commencer
- **Render** est totalement gratuit mais plus lent
- **Vercel** est excellent pour la performance front-end
- **Fly.io** offre la meilleure performance globale

## 🆘 Support

Si vous avez des problèmes :
1. Vérifiez DATABASE_URL
2. Vérifiez les logs du service
3. Assurez-vous que PostgreSQL est accessible
4. Vérifiez que toutes les variables sont définies
# Guide de Déploiement KDP Generator

## Prérequis
- Node.js 20+
- PostgreSQL database
- Compte OpenAI (pour l'IA)

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
   - Copier `.env.example` vers `.env`
   - Remplir toutes les valeurs

3. Initialiser la base de données :
```bash
npm run db:push
```

4. Build de production :
```bash
npm run build
```

5. Démarrer l'application :
```bash
npm run start
```

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

# Guide de déploiement KDP Generator

## 🚨 Problème de déploiement identifié

L'erreur `EADDRINUSE: address already in use 0.0.0.0:5000` vient de la configuration de ports entre développement et production.

## 🛠️ Solutions de déploiement

### 1. **Configuration dans Replit Console** (Recommandé)

Avant de déployer, configurez les variables d'environnement :

1. **Ouvrir les Secrets/Variables** dans la console Replit
2. **Ajouter ces variables pour la production** :
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=[votre_url_production]
   SESSION_SECRET=[votre_secret_session]
   ```

### 2. **Modifier manuellement .replit** (Si nécessaire)

Si vous avez accès au fichier `.replit`, ajoutez :

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[env]
PORT = "5000"

# Pour la production
[env.production]
NODE_ENV = "production"
PORT = "3000"
```

### 3. **Vérifications avant déploiement**

✅ **Scripts package.json corrects** :
- `build` : Compile l'application pour production
- `start` : Lance l'application en mode production

✅ **Port flexible** : Le serveur s'adapte automatiquement (5000 dev, 3000 prod)

✅ **Variables critiques** :
- `DATABASE_URL` : Base de données production
- `SESSION_SECRET` : Sécurité des sessions
- `NODE_ENV=production` : Mode production

## 🔍 Diagnostic des erreurs de déploiement

### Port conflicts (`EADDRINUSE`)
- **Cause** : Processus multiple utilisant le même port
- **Solution** : Replit gère automatiquement les ports, utilisez la variable PORT

### Build failures
- **Cause** : Dépendances manquantes ou erreurs TypeScript
- **Solution** : `npm run check` avant de déployer

### Database connection errors
- **Cause** : `DATABASE_URL` incorrect ou manquant
- **Solution** : Vérifier les variables d'environnement

## 📦 Commandes de déploiement

```bash
# Vérifier la compilation
npm run check

# Test de build local
npm run build

# Test de démarrage production
NODE_ENV=production npm run start
```

## 🎯 Étapes de déploiement Replit

1. **Configurer les variables** d'environnement
2. **Cliquer "Deploy"** dans Replit Console
3. **Replit exécute automatiquement** :
   - `npm run build` (compilation)
   - `npm run start` (démarrage production)
4. **Vérifier l'URL** de déploiement

## ⚠️ Points critiques

- **Un seul port externe** supporté en déploiement
- **Port 3000 recommandé** pour la production Replit
- **Variables DATABASE_URL** doivent pointer vers la production
- **Build process** doit réussir sans erreurs

## 🔧 Problèmes courants

### "No response from server"
- Vérifier que le port est correct (3000 en production)
- Vérifier les logs de déploiement

### "Database connection failed"
- Vérifier `DATABASE_URL` en production
- S'assurer que la base production existe

### "Build failed"
- Vérifier `npm run build` localement
- Résoudre les erreurs TypeScript/ESLint
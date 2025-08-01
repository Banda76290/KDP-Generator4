# Database Seeding System

Ce système assure que votre base de données de production aura toutes les données nécessaires (catégories KDP, etc.) automatiquement lors du déploiement.

## Comment ça fonctionne

### 🚀 Système Manuel Uniquement
- **Plus de seeding automatique** : Le seeding ne se fait plus au démarrage du serveur
- **Contrôle administrateur** : Seuls les administrateurs peuvent déclencher le seeding via la page "Système"
- **Sécurité renforcée** : Évite les mises à jour non désirées lors des rafraîchissements de page

### 📁 Fichiers importants
- `server/seedDatabase.ts` : Logique principale de seeding
- `complete-categories.sql` : Données complètes des catégories (249 catégories)
- `server/scripts/seed.ts` : Script manuel de seeding
- `server/scripts/reset.ts` : Script de reset complet

## 🛠️ Utilisation

### Seeding en production
```bash
# Plus de seeding automatique - utilisez l'interface admin
# Connectez-vous en tant qu'administrateur et utilisez la page "Système"
```

### Seeding manuel (Développement)
```bash
# Seeding simple (si base vide)
tsx server/scripts/seed.ts

# Reset complet + re-seeding
tsx server/scripts/reset.ts
```

### Via API (Admin seulement)
```bash
# Seeding via API
curl -X POST http://localhost:5000/api/admin/database/seed

# Reset via API  
curl -X POST http://localhost:5000/api/admin/database/reset
```

## 🔧 Configuration pour le déploiement

### Replit Deployment
Le fichier `.replit` est déjà configuré :
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

Le seeding se fait automatiquement au `npm run start`.

### Autres plateformes
Pour déployer sur d'autres plateformes, assurez-vous que :
1. Le fichier `complete-categories.sql` est inclus dans le build
2. La commande de démarrage appelle `npm run start`
3. La variable d'environnement `DATABASE_URL` est configurée

## 📊 Données incluses

### Catégories marketplace (249 entrées)
- **Amazon.fr** : Toutes les catégories française
- **Amazon.it** : Catégories italiennes
- **Amazon.de** : Catégories allemandes  
- **Amazon.co.uk** : Catégories britanniques
- **Amazon.es** : Catégories espagnoles
- **Amazon.com** : Catégories américaines

### Types de livres supportés
- `kindle_ebook` : Livres numériques
- `print_kdp_paperback` : Livres papier

## 🚨 Résolution de problèmes

### Erreur "No categories found"
```bash
# Vérifiez que le fichier SQL existe
ls -la complete-categories.sql

# Forcez le re-seeding
tsx server/scripts/reset.ts
```

### Base de données corrompue
```bash
# Reset complet
tsx server/scripts/reset.ts
```

### Logs de débogage
Les logs incluent automatiquement :
- ✅ Database already seeded, skipping...
- 📦 Seeding marketplace categories...
- ✅ Successfully seeded X marketplace categories
- ❌ Error seeding database: [error]

## 📈 Évolutions futures

### Ajouter de nouvelles catégories
1. Mettez à jour `complete-categories.sql`
2. Redéployez l'application
3. Ou utilisez l'API admin pour forcer le reset

### Ajouter d'autres données
Modifiez `server/seedDatabase.ts` pour inclure :
- Utilisateurs par défaut
- Configurations système
- Templates de contenu
- etc.

## 🔒 Sécurité

- Les endpoints de seeding nécessitent une authentification admin
- Les erreurs de seeding n'interrompent pas l'application
- Les données existantes ne sont pas écrasées sans confirmation explicite
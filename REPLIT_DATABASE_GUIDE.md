# Guide : Synchroniser les catégories Dev → Production avec Replit

## 🎯 Objectif
Transférer les catégories de marketplace de votre environnement de développement vers votre application de production hébergée sur Replit.

## 📋 Méthode recommandée : Copier-Coller SQL

### Étape 1 : Exporter depuis le développement
1. Allez sur la page **Système** de votre environnement de développement
2. Dans la section "Synchronisation Dev → Production"
3. Cliquez sur **"Copier SQL"**
4. Le code SQL est maintenant copié dans votre presse-papiers

### Étape 2 : Importer en production
1. **Ouvrez votre projet de PRODUCTION dans Replit**
2. **Cliquez sur l'onglet "Database"** (icône base de données dans la barre latérale)
3. **Dans la console SQL** qui s'affiche en bas :
   - Collez le code SQL (Ctrl+V / Cmd+V)
   - Appuyez sur **Entrée** pour exécuter
4. **Vérifiez** que l'opération s'est bien déroulée

## 💾 Méthode alternative : Fichier SQL

Si la méthode copier-coller ne fonctionne pas :

1. Cliquez sur **"Télécharger SQL"** au lieu de "Copier SQL"
2. Un fichier .sql sera téléchargé sur votre ordinateur
3. Dans votre projet de production Replit :
   - Uploadez le fichier .sql
   - Ouvrez l'onglet Database
   - Exécutez le contenu du fichier dans la console SQL

## ⚠️ Points importants

- **Sauvegarde** : Ces opérations remplaceront TOUTES les catégories existantes en production
- **Vérification** : Testez toujours sur un environnement de test avant la production
- **URL Production** : Si vous connaissez l'URL exacte, vous pouvez essayer la synchronisation directe

## 🔧 En cas de problème

1. **Erreur de connexion** : Vérifiez que l'URL de production est correcte
2. **Erreur 403/401** : Problème d'authentification ou de CORS
3. **Erreur 404** : L'API de migration n'existe pas sur le serveur cible
4. **Solution de secours** : Utilisez toujours la méthode manuelle (copier-coller)

## 📊 Après la synchronisation

Vérifiez que les catégories sont bien présentes en :
1. Allant sur votre site de production
2. Créant/éditant un livre
3. Vérifiant que les catégories apparaissent correctement

---

*Ce guide est généré automatiquement par le système KDP Generator*
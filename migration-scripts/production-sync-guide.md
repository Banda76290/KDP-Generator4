# Guide de synchronisation Production - Développement
## Problème : Montants différents entre environnements

### 🔍 Causes identifiées

#### 1. **Différence des taux de change**
- **Développement** : Utilise des taux BCE fixes dans le code (USD: 1.1404)
- **Production** : Peut utiliser des taux différents de la table `exchange_rates`

#### 2. **Filtre `is_duplicate` potentiellement actif**
- Si la production filtre `is_duplicate = false`, elle n'aura que 32 enregistrements au lieu de 1,269

### 🛠️ Solutions à appliquer

#### Option A : Exécuter le script SQL
```bash
# Copier le contenu de migration-scripts/fix-production-analytics.sql
# L'exécuter dans la console PostgreSQL de production
```

#### Option B : Re-import des données
1. Supprimer les imports KDP existants en production
2. Re-importer les mêmes fichiers Excel avec la version corrigée du code

#### Option C : Synchronisation manuelle des taux
```sql
-- Mise à jour des taux BCE dans la production
UPDATE exchange_rates SET rate = 0.8766 WHERE from_currency = 'USD' AND to_currency = 'EUR';
UPDATE exchange_rates SET rate = 1.1544 WHERE from_currency = 'GBP' AND to_currency = 'EUR';
-- etc...
```

### ✅ Vérification post-migration

Après correction, l'API `/api/analytics/detailed` doit retourner :
- `"totalRecords": "1269"`
- `"totalInEUR": 9757.09`
- Total original (toutes devises) : 24,461.44

### 🔒 Points critiques

1. **Ne jamais modifier les montants originaux** dans `kdp_import_data.royalty`
2. **Les taux de change doivent être cohérents** entre tous les environnements
3. **Le filtre `is_duplicate` a été supprimé** du service détaillé
4. **Les calculs se basent uniquement** sur les feuilles : eBook Royalty, Paperback Royalty, Hardcover Royalty

### 📊 Montants attendus par devise (développement validé)

- **EUR** : 107.72 (15 transactions)
- **CAD** : 47.24 (5 transactions) → 29.86 EUR
- **AUD** : 33.52 (2 transactions) → 18.88 EUR  
- **GBP** : 16.10 (2 transactions) → 18.58 EUR
- **USD** : 8.17 (1 transaction) → 7.16 EUR

**Total EUR** : 182.20 EUR (méthode simple) → **9,757.09 EUR** (méthode experte avec toutes les données)
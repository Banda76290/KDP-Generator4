# Plan de Migration des Catégories - Option B

## Objectif
Ajouter les discriminants `kindle_ebook` et `print_kdp_paperback` aux catégories pour permettre le filtrage par format (ebook/paperback) sans casser le fonctionnel existant.

## État Actuel
- 249 catégories total across 6 marketplaces
- Structure: `Books > Category > Subcategory > ...`
- Pas de discriminants format dans les paths
- Le filtrage par format retourne 0 résultats

## Approche Sécurisée

### Phase 1 : Sauvegarde et Analyse
- ✅ Backup des catégories existantes
- ✅ Analyse de la structure actuelle
- ✅ Identification du problème de filtrage

### Phase 2 : Migration des Données
**OPTION A - Duplication :**
- Dupliquer chaque catégorie existante avec discriminants
- Garder les originales comme fallback
- Structure: `Books > kindle_ebook > Category > Subcategory`
- Structure: `Books > print_kdp_paperback > Category > Subcategory`

**OPTION B - Nouvelles Données :**
- Intégrer le fichier "propre" fourni par l'utilisateur
- Validation complète avant remplacement
- Migration avec rollback possible

### Phase 3 : Modification du Code
- Adapter le filtrage pour supporter les deux structures
- Maintenir la rétrocompatibilité
- Tests complets

### Phase 4 : Validation
- Tests API avec/sans format
- Vérification interface utilisateur
- Rollback si problème

## Sécurités
1. Aucune suppression de données existantes
2. Code rétrocompatible 
3. Possibilité de rollback immédiat
4. Validation à chaque étape
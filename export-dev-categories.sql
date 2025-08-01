-- Export des catégories de développement pour import en production
-- Ce script contient toutes les catégories de la base de développement

-- Première étape: Vider la table de production
TRUNCATE TABLE marketplace_categories;

-- Deuxième étape: Insérer les données de développement
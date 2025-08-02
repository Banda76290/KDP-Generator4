-- Script de migration pour corriger les problèmes d'analytics en production
-- À exécuter en production pour synchroniser avec développement

-- 1. Mise à jour des taux de change BCE pour assurer la cohérence
-- Ces taux sont ceux utilisés par l'expert method validée

-- Supprimer les anciens taux si ils existent
DELETE FROM exchange_rates WHERE from_currency IN ('USD', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'MXN', 'BRL');

-- Insérer les taux BCE officiels utilisés dans le code
INSERT INTO exchange_rates (from_currency, to_currency, rate, updated_at, created_at, date) VALUES
('EUR', 'EUR', 1.0000, NOW(), NOW(), CURRENT_DATE),
('USD', 'EUR', 0.8766, NOW(), NOW(), CURRENT_DATE), -- 1/1.1404
('GBP', 'EUR', 1.1544, NOW(), NOW(), CURRENT_DATE), -- 1/0.8665
('CAD', 'EUR', 0.6320, NOW(), NOW(), CURRENT_DATE), -- 1/1.5822
('AUD', 'EUR', 0.5632, NOW(), NOW(), CURRENT_DATE), -- 1/1.7756
('JPY', 'EUR', 0.0058, NOW(), NOW(), CURRENT_DATE), -- 1/171.61
('INR', 'EUR', 0.0100, NOW(), NOW(), CURRENT_DATE), -- 1/99.79
('MXN', 'EUR', 0.0463, NOW(), NOW(), CURRENT_DATE), -- 1/21.6158
('BRL', 'EUR', 0.1559, NOW(), NOW(), CURRENT_DATE); -- 1/6.4129

-- 2. Diagnostic des données KDP pour vérifier la cohérence
-- Vous devez vérifier que ces chiffres correspondent au développement :

SELECT 
  'Production Analytics Check' as check_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN kid.royalty IS NOT NULL THEN CAST(kid.royalty AS DECIMAL) ELSE 0 END) as total_original_amounts,
  COUNT(CASE WHEN kid.is_duplicate = false THEN 1 END) as non_duplicates,
  COUNT(CASE WHEN kid.is_duplicate = true THEN 1 END) as duplicates,
  COUNT(DISTINCT ki.file_name) as unique_files
FROM kdp_import_data kid
JOIN kdp_imports ki ON kid.import_id = ki.id
WHERE ki.file_name LIKE '%Royalties_Estimator%'
AND kid.sheet_name IN ('eBook Royalty', 'Paperback Royalty', 'Hardcover Royalty');

-- Attendu en production (comme en développement) :
-- total_records: 1269
-- total_original_amounts: 24461.44
-- non_duplicates: 32
-- duplicates: 1237
-- unique_files: 1

-- 3. Si les totaux ne correspondent pas, voici le diagnostic :
SELECT 
  'Diagnostic par feuille' as info,
  kid.sheet_name,
  COUNT(*) as records_per_sheet,
  SUM(CASE WHEN kid.royalty IS NOT NULL THEN CAST(kid.royalty AS DECIMAL) ELSE 0 END) as total_per_sheet
FROM kdp_import_data kid
JOIN kdp_imports ki ON kid.import_id = ki.id
WHERE ki.file_name LIKE '%Royalties_Estimator%'
AND kid.sheet_name IN ('eBook Royalty', 'Paperback Royalty', 'Hardcover Royalty')
GROUP BY kid.sheet_name
ORDER BY total_per_sheet DESC;

-- Attendu :
-- eBook Royalty: 199 records, 6119.05 total
-- Paperback Royalty: 1061 records, 18282.80 total
-- Hardcover Royalty: 9 records, 59.59 total
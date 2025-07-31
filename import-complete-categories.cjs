// Import script for complete category data with full depth
const fs = require('fs');
const path = require('path');

// Read the attached file content
const dataContent = `amazon.it		kindle_ebook	Affari e Finanza	Imprenditoria	Startup	Raccolta fondi					
amazon.it		print_kdp_paperback	Affari e Finanza	Imprenditoria	Startup	Raccolta fondi					
amazon.it		kindle_ebook	Bambini e Ragazzi	Libri per bambini	Libri illustrati	Animali					
amazon.it		print_kdp_paperback	Bambini e Ragazzi	Libri per bambini	Libri illustrati	Animali					
amazon.co.uk		print_kdp_paperback	Business & Finance	Entrepreneurship	Startups	Fundraising					
amazon.co.uk		kindle_ebook	Business & Finance	Entrepreneurship	Startups	Fundraising					
amazon.de		kindle_ebook	Bücher & Literatur	Fantasy	High Fantasy	Episch	Mittelalterlich				
amazon.de		print_kdp_paperback	Bücher & Literatur	Fantasy	High Fantasy	Episch	Mittelalterlich				
amazon.co.uk		print_kdp_paperback	Children & Teens	Children's Books	Picture Books	Animals					
amazon.co.uk		kindle_ebook	Children & Teens	Children's Books	Picture Books	Animals					
amazon.es		kindle_ebook	Ciencia, Tecnología y Medicina	Informática	Programación	Python	Ciencia de datos				
amazon.es		print_kdp_paperback	Ciencia, Tecnología y Medicina	Informática	Programación	Python	Ciencia de datos				
amazon.fr		print_kdp_paperback	Enfants & Adolescents	Livres pour enfants	Albums illustrés	Animaux					
amazon.fr		kindle_ebook	Enfants & Adolescents	Livres pour enfants	Albums illustrés	Animaux					
amazon.fr		print_kdp_paperback	Entreprise & Bourse	Entrepreneuriat	Start-up	Levée de fonds					
amazon.fr		kindle_ebook	Entreprise & Bourse	Entrepreneuriat	Start-up	Levée de fonds					
amazon.fr		kindle_ebook	Guide & Conseils	Bien-être	Méditation	Pleine conscience	Yoga	Yoga sur chaise			
amazon.fr		print_kdp_paperback	Guide & Conseils	Bien-être	Méditation	Pleine conscience	Yoga				
amazon.it		kindle_ebook	Guide e Consigli	Benessere	Meditazione	Consapevolezza	Yoga				
amazon.it		print_kdp_paperback	Guide e Consigli	Benessere	Meditazione	Consapevolezza	Yoga				
amazon.co.uk		kindle_ebook	Guides & Advice	Wellness	Meditation	Mindfulness	Yoga				
amazon.co.uk		print_kdp_paperback	Guides & Advice	Wellness	Meditation	Mindfulness	Yoga				
amazon.es		kindle_ebook	Guías y Consejos	Bienestar	Meditación	Atención plena	Yoga				
amazon.es		print_kdp_paperback	Guías y Consejos	Bienestar	Meditación	Atención plena	Yoga				
amazon.es		kindle_ebook	Infantil y Juvenil	Libros infantiles	Libros ilustrados	Animales					
amazon.es		print_kdp_paperback	Infantil y Juvenil	Libros infantiles	Libros ilustrados	Animales					
amazon.de		kindle_ebook	Kinder & Jugendbücher	Kinderbücher	Bilderbücher	Tiere					
amazon.de		print_kdp_paperback	Kinder & Jugendbücher	Kinderbücher	Bilderbücher	Tiere					
amazon.it		print_kdp_paperback	Libri e Letteratura	Fantasy	High Fantasy	Epico	Medievale				
amazon.it		kindle_ebook	Libri e Letteratura	Fantasy	High Fantasy	Epico	Medievale				
amazon.es		print_kdp_paperback	Libros y Literatura	Fantasía	Alta fantasía	Épica	Medieval				
amazon.es		kindle_ebook	Libros y Literatura	Fantasía	Alta fantasía	Épica	Medieval				
amazon.co.uk		print_kdp_paperback	Literature & Fiction	Fantasy	High Fantasy	Epic	Medieval				
amazon.co.uk		kindle_ebook	Literature & Fiction	Fantasy	High Fantasy	Epic	Medieval				
amazon.fr		print_kdp_paperback	Littérature & Fiction	Fantasy	High Fantasy2	Épique	Médiéval				
amazon.fr		kindle_ebook	Littérature & Fiction	Roman	Amour	Épique	Médiéval	Tip	Top	Cool	Moule
amazon.fr		kindle_ebook	Littérature & Fiction	Fantasy	High Fantasy	Épique	Médiéval				
amazon.es		print_kdp_paperback	Negocios y Finanzas	Emprendimiento	Startups	Recaudación de fondos					
amazon.es		kindle_ebook	Negocios y Finanzas	Emprendimiento	Startups	Recaudación de fondos					
amazon.de		kindle_ebook	Ratgeber & Tipps	Wellness	Meditation	Achtsamkeit	Yoga				
amazon.de		print_kdp_paperback	Ratgeber & Tipps	Wellness	Meditation	Achtsamkeit	Yoga				
amazon.co.uk		print_kdp_paperback	Science, Tech & Medical	Computers & Technology	Programming	Python	Data Science				
amazon.co.uk		kindle_ebook	Science, Tech & Medical	Computers & Technology	Programming	Python	Data Science				
amazon.fr		print_kdp_paperback	Sciences, Techniques & Médecine	Informatique	Programmation	Python	Data Science				
amazon.fr		kindle_ebook	Sciences, Techniques & Médecine	Informatique	Programmation	Python	Data Science				
amazon.it		kindle_ebook	Scienza, Tecnologia e Medicina	Informatica	Programmazione	Python	Data Science				
amazon.it		print_kdp_paperback	Scienza, Tecnologia e Medicina	Informatica	Programmazione	Python	Data Science				
amazon.de		print_kdp_paperback	Wirtschaft & Finanzen	Unternehmertum	Startups	Finanzierung					
amazon.de		kindle_ebook	Wirtschaft & Finanzen	Unternehmertum	Startups	Finanzierung					
amazon.de		kindle_ebook	Wissenschaft, Technik & Medizin	Computer & Technologie	Programmierung	Python	Datenwissenschaft				
amazon.de		print_kdp_paperback	Wissenschaft, Technik & Medizin	Computer & Technologie	Programmierung	Python	Datenwissenschaft				`;

function parseCompleteCategories() {
  const lines = dataContent.trim().split('\n');
  const categories = [];
  const categoryMap = new Map(); // To track unique category paths

  lines.forEach((line, index) => {
    const columns = line.split('\t');
    if (columns.length < 4) return; // Skip invalid lines

    const marketplace = columns[0].trim();
    const format = columns[1].trim(); // kindle_ebook or print_kdp_paperback
    
    // Extract all category levels (columns 2 onwards, stopping at empty columns)
    const categoryLevels = [];
    for (let i = 2; i < columns.length; i++) {
      const level = columns[i]?.trim();
      if (level && level !== '') {
        categoryLevels.push(level);
      } else {
        break; // Stop at first empty column
      }
    }

    if (categoryLevels.length === 0) return;

    // Convert marketplace format
    const marketplaceMap = {
      'amazon.com': 'Amazon.com',
      'amazon.fr': 'Amazon.fr', 
      'amazon.de': 'Amazon.de',
      'amazon.es': 'Amazon.es',
      'amazon.it': 'Amazon.it',
      'amazon.co.uk': 'Amazon.co.uk'
    };

    const formattedMarketplace = marketplaceMap[marketplace] || marketplace;

    // Build category hierarchy
    for (let depth = 1; depth <= categoryLevels.length; depth++) {
      const currentLevels = categoryLevels.slice(0, depth);
      const categoryPath = 'Books > ' + currentLevels.join(' > ');
      const parentPath = depth > 1 ? 'Books > ' + currentLevels.slice(0, -1).join(' > ') : 'Books';
      const displayName = currentLevels[currentLevels.length - 1];
      
      // Create unique key for this category
      const uniqueKey = `${formattedMarketplace}|${categoryPath}`;
      
      if (!categoryMap.has(uniqueKey)) {
        categoryMap.set(uniqueKey, {
          marketplace: formattedMarketplace,
          categoryPath,
          parentPath: depth > 1 ? parentPath : null,
          level: depth + 1, // +1 because Books is level 1
          displayName,
          isSelectable: true, // Make all categories selectable for now
          sortOrder: categories.length + 1
        });
      }
    }
  });

  return Array.from(categoryMap.values());
}

// Generate SQL insert statements
function generateSQLInserts() {
  const categories = parseCompleteCategories();
  
  console.log(`-- Complete category import with ${categories.length} total categories`);
  console.log('-- Clear existing data and insert new complete data');
  console.log('DELETE FROM marketplace_categories;');
  console.log('');
  
  categories.forEach((cat, index) => {
    const categoryPath = cat.categoryPath.replace(/'/g, "''");
    const parentPath = cat.parentPath ? cat.parentPath.replace(/'/g, "''") : 'NULL';
    const displayName = cat.displayName.replace(/'/g, "''");
    
    console.log(`INSERT INTO marketplace_categories (marketplace, category_path, parent_path, level, display_name, is_selectable, sort_order) VALUES ('${cat.marketplace}', '${categoryPath}', ${parentPath === 'NULL' ? 'NULL' : `'${parentPath}'`}, ${cat.level}, '${displayName}', ${cat.isSelectable}, ${cat.sortOrder});`);
  });
  
  console.log('');
  console.log('-- Summary by marketplace and depth:');
  const summary = {};
  categories.forEach(cat => {
    if (!summary[cat.marketplace]) summary[cat.marketplace] = {};
    if (!summary[cat.marketplace][cat.level]) summary[cat.marketplace][cat.level] = 0;
    summary[cat.marketplace][cat.level]++;
  });
  
  Object.entries(summary).forEach(([marketplace, levels]) => {
    console.log(`-- ${marketplace}:`);
    Object.entries(levels).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([level, count]) => {
      console.log(`--   Level ${level}: ${count} categories`);
    });
  });
}

// Execute the generation
generateSQLInserts();
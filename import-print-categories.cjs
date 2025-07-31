// Import script for print_kdp_paperback categories only
const categories = [
  // Amazon.com (missing data)
  { marketplace: 'Amazon.com', path: ['Business & Finance', 'Entrepreneurship', 'Startups', 'Fundraising'] },
  { marketplace: 'Amazon.com', path: ['Children & Teens', 'Children\'s Books', 'Picture Books', 'Animals'] },
  { marketplace: 'Amazon.com', path: ['Literature & Fiction', 'Fantasy', 'High Fantasy', 'Epic', 'Medieval'] },
  { marketplace: 'Amazon.com', path: ['Science, Tech & Medical', 'Computers & Technology', 'Programming', 'Python', 'Data Science'] },
  { marketplace: 'Amazon.com', path: ['Guides & Advice', 'Wellness', 'Meditation', 'Mindfulness', 'Yoga'] },
  
  // Amazon.fr (including the deep category)
  { marketplace: 'Amazon.fr', path: ['Enfants & Adolescents', 'Livres pour enfants', 'Albums illustrés', 'Animaux'] },
  { marketplace: 'Amazon.fr', path: ['Entreprise & Bourse', 'Entrepreneuriat', 'Start-up', 'Levée de fonds'] },
  { marketplace: 'Amazon.fr', path: ['Guide & Conseils', 'Bien-être', 'Méditation', 'Pleine conscience', 'Yoga'] },
  { marketplace: 'Amazon.fr', path: ['Littérature & Fiction', 'Fantasy', 'High Fantasy2', 'Épique', 'Médiéval'] },
  { marketplace: 'Amazon.fr', path: ['Littérature & Fiction', 'Roman', 'Amour', 'Épique', 'Médiéval', 'Tip', 'Top', 'Cool', 'Moule'] },
  { marketplace: 'Amazon.fr', path: ['Sciences, Techniques & Médecine', 'Informatique', 'Programmation', 'Python', 'Data Science'] },
  
  // Amazon.de
  { marketplace: 'Amazon.de', path: ['Bücher & Literatur', 'Fantasy', 'High Fantasy', 'Episch', 'Mittelalterlich'] },
  { marketplace: 'Amazon.de', path: ['Kinder & Jugendbücher', 'Kinderbücher', 'Bilderbücher', 'Tiere'] },
  { marketplace: 'Amazon.de', path: ['Ratgeber & Tipps', 'Wellness', 'Meditation', 'Achtsamkeit', 'Yoga'] },
  { marketplace: 'Amazon.de', path: ['Wirtschaft & Finanzen', 'Unternehmertum', 'Startups', 'Finanzierung'] },
  { marketplace: 'Amazon.de', path: ['Wissenschaft, Technik & Medizin', 'Computer & Technologie', 'Programmierung', 'Python', 'Datenwissenschaft'] },
  
  // Amazon.es
  { marketplace: 'Amazon.es', path: ['Ciencia, Tecnología y Medicina', 'Informática', 'Programación', 'Python', 'Ciencia de datos'] },
  { marketplace: 'Amazon.es', path: ['Infantil y Juvenil', 'Libros infantiles', 'Libros ilustrados', 'Animales'] },
  { marketplace: 'Amazon.es', path: ['Libros y Literatura', 'Fantasía', 'Alta fantasía', 'Épica', 'Medieval'] },
  { marketplace: 'Amazon.es', path: ['Negocios y Finanzas', 'Emprendimiento', 'Startups', 'Recaudación de fondos'] },
  { marketplace: 'Amazon.es', path: ['Guías y Consejos', 'Bienestar', 'Meditación', 'Atención plena', 'Yoga'] },
  
  // Amazon.it
  { marketplace: 'Amazon.it', path: ['Affari e Finanza', 'Imprenditoria', 'Startup', 'Raccolta fondi'] },
  { marketplace: 'Amazon.it', path: ['Bambini e Ragazzi', 'Libri per bambini', 'Libri illustrati', 'Animali'] },
  { marketplace: 'Amazon.it', path: ['Libri e Letteratura', 'Fantasy', 'High Fantasy', 'Epico', 'Medievale'] },
  { marketplace: 'Amazon.it', path: ['Scienza, Tecnologia e Medicina', 'Informatica', 'Programmazione', 'Python', 'Data Science'] },
  { marketplace: 'Amazon.it', path: ['Guide e Consigli', 'Benessere', 'Meditazione', 'Consapevolezza', 'Yoga'] },
  
  // Amazon.co.uk
  { marketplace: 'Amazon.co.uk', path: ['Business & Finance', 'Entrepreneurship', 'Startups', 'Fundraising'] },
  { marketplace: 'Amazon.co.uk', path: ['Children & Teens', 'Children\'s Books', 'Picture Books', 'Animals'] },
  { marketplace: 'Amazon.co.uk', path: ['Literature & Fiction', 'Fantasy', 'High Fantasy', 'Epic', 'Medieval'] },
  { marketplace: 'Amazon.co.uk', path: ['Science, Tech & Medical', 'Computers & Technology', 'Programming', 'Python', 'Data Science'] },
  { marketplace: 'Amazon.co.uk', path: ['Guides & Advice', 'Wellness', 'Meditation', 'Mindfulness', 'Yoga'] }
];

function generateCategoryHierarchy() {
  const categoryMap = new Map();
  
  categories.forEach(cat => {
    // Build hierarchy for each depth level
    for (let depth = 1; depth <= cat.path.length; depth++) {
      const currentLevels = cat.path.slice(0, depth);
      const categoryPath = 'Books > ' + currentLevels.join(' > ');
      const parentPath = depth > 1 ? 'Books > ' + currentLevels.slice(0, -1).join(' > ') : null;
      const displayName = currentLevels[currentLevels.length - 1];
      
      const uniqueKey = `${cat.marketplace}|${categoryPath}`;
      
      if (!categoryMap.has(uniqueKey)) {
        categoryMap.set(uniqueKey, {
          marketplace: cat.marketplace,
          categoryPath,
          parentPath,
          level: depth + 1, // +1 because Books is level 1
          displayName,
          isSelectable: true,
          sortOrder: Array.from(categoryMap.keys()).length + 1
        });
      }
    }
  });
  
  return Array.from(categoryMap.values());
}

function generateSQL() {
  const allCategories = generateCategoryHierarchy();
  
  console.log(`-- Print KDP categories import with ${allCategories.length} total categories`);
  console.log('-- Clear existing data and insert new print_kdp_paperback categories');
  console.log('DELETE FROM marketplace_categories;');
  console.log('');
  
  allCategories.forEach((cat, index) => {
    const categoryPath = cat.categoryPath.replace(/'/g, "''");
    const parentPath = cat.parentPath ? cat.parentPath.replace(/'/g, "''") : null;
    const displayName = cat.displayName.replace(/'/g, "''");
    
    console.log(`INSERT INTO marketplace_categories (marketplace, category_path, parent_path, level, display_name, is_selectable, sort_order) VALUES ('${cat.marketplace}', '${categoryPath}', ${parentPath ? `'${parentPath}'` : 'NULL'}, ${cat.level}, '${displayName}', ${cat.isSelectable}, ${cat.sortOrder});`);
  });
  
  console.log('');
  console.log('-- Summary by marketplace and max depth:');
  const summary = {};
  allCategories.forEach(cat => {
    if (!summary[cat.marketplace]) summary[cat.marketplace] = { count: 0, maxLevel: 0 };
    summary[cat.marketplace].count++;
    summary[cat.marketplace].maxLevel = Math.max(summary[cat.marketplace].maxLevel, cat.level);
  });
  
  Object.entries(summary).forEach(([marketplace, stats]) => {
    console.log(`-- ${marketplace}: ${stats.count} categories, max level ${stats.maxLevel}`);
  });
}

generateSQL();
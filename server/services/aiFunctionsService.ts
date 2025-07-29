// Service for managing AI functions dynamically based on existing site features
export interface AIFunction {
  key: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  requiresBookContext: boolean;
  requiresProjectContext: boolean;
  defaultModel: string;
  defaultSystemPrompt: string;
  defaultUserPromptTemplate: string;
  maxTokens: number;
  temperature: number;
  availableForTiers: string[];
  sortOrder: number;
}

class AIFunctionsService {
  // Define AI functions based on existing site features
  private getStaticFunctions(): AIFunction[] {
    return [
      {
        key: 'book_description',
        name: 'Description de livre',
        description: 'Génère une description marketing accrocheuse pour votre livre',
        category: 'marketing',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'Tu es un expert en marketing éditorial. Écris des descriptions de livres qui convertissent les visiteurs en acheteurs.',
        defaultUserPromptTemplate: 'Écris une description marketing pour le livre "{title}" de genre {categories}. Description actuelle: {description}. Rends-la plus accrocheuse et vendeur.',
        maxTokens: 1000,
        temperature: 0.7,
        availableForTiers: ['free', 'premium'],
        sortOrder: 1
      },
      {
        key: 'book_structure',
        name: 'Structure de livre',
        description: 'Crée un plan détaillé et une structure pour votre livre',
        category: 'content',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'Tu es un consultant en structure littéraire. Crée des plans de livres détaillés et logiques.',
        defaultUserPromptTemplate: 'Crée une structure détaillée pour le livre "{title}" - {description}. Inclus les chapitres, sections principales et points clés.',
        maxTokens: 2000,
        temperature: 0.8,
        availableForTiers: ['premium'],
        sortOrder: 2
      },
      {
        key: 'chapter_content',
        name: 'Contenu de chapitre',
        description: 'Génère le contenu détaillé d\'un chapitre spécifique',
        category: 'content',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'Tu es un écrivain professionnel. Écris du contenu de qualité, engageant et informatif.',
        defaultUserPromptTemplate: 'Écris le contenu du chapitre sur le sujet: {aiPrompt}. Livre: "{title}" - {description}. Style: {language}.',
        maxTokens: 3000,
        temperature: 0.8,
        availableForTiers: ['premium'],
        sortOrder: 3
      },
      {
        key: 'marketing_copy',
        name: 'Texte marketing',
        description: 'Crée du contenu marketing pour promouvoir votre livre',
        category: 'marketing',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'Tu es un spécialiste du marketing digital pour auteurs. Crée du contenu qui génère des ventes.',
        defaultUserPromptTemplate: 'Crée du contenu marketing pour promouvoir le livre "{title}" - {description}. Public cible: {categories}. Inclus accroches, posts réseaux sociaux, et argumentaires.',
        maxTokens: 1500,
        temperature: 0.7,
        availableForTiers: ['free', 'premium'],
        sortOrder: 4
      },
      {
        key: 'keyword_research',
        name: 'Recherche de mots-clés',
        description: 'Trouve les meilleurs mots-clés pour le référencement de votre livre',
        category: 'seo',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o-mini',
        defaultSystemPrompt: 'Tu es un expert SEO spécialisé dans l\'édition. Trouve des mots-clés pertinents et recherchés.',
        defaultUserPromptTemplate: 'Trouve 20 mots-clés pertinents pour le livre "{title}" de catégorie {categories}. Description: {description}. Inclus mots-clés principaux et longue traîne.',
        maxTokens: 800,
        temperature: 0.5,
        availableForTiers: ['free', 'premium'],
        sortOrder: 5
      },
      {
        key: 'author_bio',
        name: 'Biographie d\'auteur',
        description: 'Génère une biographie professionnelle pour vos profils d\'auteur',
        category: 'profile',
        isActive: true,
        requiresBookContext: false,
        requiresProjectContext: true,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'Tu es un rédacteur spécialisé dans les biographies d\'auteurs. Écris des biographies professionnelles et engageantes.',
        defaultUserPromptTemplate: 'Écris une biographie professionnelle pour {fullAuthorName}, auteur du projet "{name}". Description du projet: {description}.',
        maxTokens: 500,
        temperature: 0.6,
        availableForTiers: ['free', 'premium'],
        sortOrder: 6
      }
    ];
  }

  // Get all available AI functions
  getAvailableFunctions(): AIFunction[] {
    return this.getStaticFunctions().filter(func => func.isActive);
  }

  // Get functions by category
  getFunctionsByCategory(): Record<string, AIFunction[]> {
    const functions = this.getAvailableFunctions();
    const categories: Record<string, AIFunction[]> = {};

    functions.forEach(func => {
      if (!categories[func.category]) {
        categories[func.category] = [];
      }
      categories[func.category].push(func);
    });

    // Sort functions within categories by sortOrder
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return categories;
  }

  // Get function by key
  getFunctionByKey(key: string): AIFunction | undefined {
    return this.getAvailableFunctions().find(func => func.key === key);
  }

  // Get functions available for a specific subscription tier
  getFunctionsForTier(tier: string): AIFunction[] {
    return this.getAvailableFunctions().filter(func => 
      func.availableForTiers.includes(tier)
    );
  }
}

export const aiFunctionsService = new AIFunctionsService();
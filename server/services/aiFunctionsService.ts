import { storage } from '../storage';
import type { AiPromptTemplate } from '@shared/schema';

// Service for managing AI functions dynamically based on database templates
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
  // Add template connection
  templateId?: string;
}

class AIFunctionsService {
  // Get AI functions from database templates + static functions
  async getAllFunctions(): Promise<AIFunction[]> {
    try {
      // Get templates from database
      const templates = await storage.getAllAiPromptTemplates();
      const databaseFunctions = templates
        .filter(template => template.isActive)
        .map(template => this.templateToFunction(template));
      
      // Get static functions
      const staticFunctions = this.getStaticFunctions();
      
      // Combine and return (database templates take priority)
      const allFunctions = [...databaseFunctions, ...staticFunctions];
      
      // Remove duplicates based on key (database takes priority)
      const uniqueFunctions = allFunctions.reduce((acc, func) => {
        if (!acc.some(existing => existing.key === func.key)) {
          acc.push(func);
        }
        return acc;
      }, [] as AIFunction[]);
      
      return uniqueFunctions;
    } catch (error) {
      console.error('Error fetching AI functions from database:', error);
      // Fallback to static functions if database fails
      return this.getStaticFunctions();
    }
  }

  // Convert database template to AI function
  private templateToFunction(template: AiPromptTemplate): AIFunction {
    return {
      key: template.type, // Use type as key
      name: template.name,
      description: `Génération ${template.type} avec l'IA`,
      category: this.getCategoryFromType(template.type),
      isActive: template.isActive ?? true,
      requiresBookContext: true, // Most functions need book context
      requiresProjectContext: false,
      defaultModel: template.model || 'gpt-4o',
      defaultSystemPrompt: template.systemPrompt,
      defaultUserPromptTemplate: template.userPromptTemplate,
      maxTokens: template.maxTokens || 2000,
      temperature: parseFloat(template.temperature || '0.7'),
      availableForTiers: ['free', 'premium'], // Default tiers
      sortOrder: 1,
      templateId: template.id
    };
  }

  // Determine category from template type
  private getCategoryFromType(type: string): string {
    const typeToCategory: Record<string, string> = {
      'description': 'marketing',
      'marketing': 'marketing', 
      'title': 'marketing',
      'keywords': 'seo',
      'categories': 'seo',
      'structure': 'content',
      'chapters': 'content',
      'synopsis': 'content',
      'blurb': 'marketing'
    };
    return typeToCategory[type] || 'content';
  }

  // Define AI functions based on existing site features (fallback)
  private getStaticFunctions(): AIFunction[] {
    return [
      {
        key: 'book_description',
        name: 'Book Description',
        description: 'Generate compelling marketing description for your book',
        category: 'marketing',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'You are an expert in book marketing. Write book descriptions that convert visitors into buyers.',
        defaultUserPromptTemplate: 'Write a marketing description for the book "{title}" in the {categories} genre. Current description: {description}. Make it more compelling and sales-oriented.',
        maxTokens: 1000,
        temperature: 0.7,
        availableForTiers: ['free', 'premium'],
        sortOrder: 1
      },
      {
        key: 'book_structure',
        name: 'Book Structure',
        description: 'Create detailed outline and structure for your book',
        category: 'content',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'You are a literary structure consultant. Create detailed and logical book outlines.',
        defaultUserPromptTemplate: 'Create a detailed structure for the book "{title}" - {description}. Include chapters, main sections, and key points.',
        maxTokens: 2000,
        temperature: 0.8,
        availableForTiers: ['premium'],
        sortOrder: 2
      },
      {
        key: 'chapter_content',
        name: 'Chapter Content',
        description: 'Generate detailed content for a specific chapter',
        category: 'content',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'You are a professional writer. Write quality content that is engaging and informative.',
        defaultUserPromptTemplate: 'Write the chapter content on the topic: {aiPrompt}. Book: "{title}" - {description}. Style: {language}.',
        maxTokens: 3000,
        temperature: 0.8,
        availableForTiers: ['premium'],
        sortOrder: 3
      },
      {
        key: 'marketing_copy',
        name: 'Marketing Copy',
        description: 'Create marketing content to promote your book',
        category: 'marketing',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'You are a digital marketing specialist for authors. Create content that generates sales.',
        defaultUserPromptTemplate: 'Create marketing content to promote the book "{title}" - {description}. Target audience: {categories}. Include hooks, social media posts, and sales arguments.',
        maxTokens: 1500,
        temperature: 0.7,
        availableForTiers: ['free', 'premium'],
        sortOrder: 4
      },
      {
        key: 'keyword_research',
        name: 'Keyword Research',
        description: 'Find the best keywords for your book SEO',
        category: 'seo',
        isActive: true,
        requiresBookContext: true,
        requiresProjectContext: false,
        defaultModel: 'gpt-4o-mini',
        defaultSystemPrompt: 'You are an SEO expert specialized in publishing. Find relevant and searched keywords.',
        defaultUserPromptTemplate: 'Find 20 relevant keywords for the book "{title}" in category {categories}. Description: {description}. Include main keywords and long-tail variations.',
        maxTokens: 800,
        temperature: 0.5,
        availableForTiers: ['free', 'premium'],
        sortOrder: 5
      },
      {
        key: 'author_bio',
        name: 'Author Biography',
        description: 'Generate professional biography for your author profiles',
        category: 'profile',
        isActive: true,
        requiresBookContext: false,
        requiresProjectContext: true,
        defaultModel: 'gpt-4o',
        defaultSystemPrompt: 'You are a copywriter specialized in author biographies. Write professional and engaging biographies.',
        defaultUserPromptTemplate: 'Write a professional biography for {fullAuthorName}, author of the project "{name}". Project description: {description}.',
        maxTokens: 500,
        temperature: 0.6,
        availableForTiers: ['free', 'premium'],
        sortOrder: 6
      }
    ];
  }

  // Get all available AI functions (async version)
  async getAvailableFunctions(): Promise<AIFunction[]> {
    const allFunctions = await this.getAllFunctions();
    return allFunctions.filter(func => func.isActive);
  }

  // Get functions by category (async version)
  async getFunctionsByCategory(): Promise<Record<string, AIFunction[]>> {
    const functions = await this.getAvailableFunctions();
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

  // Get function by key (async version)
  async getFunctionByKey(key: string): Promise<AIFunction | undefined> {
    const functions = await this.getAvailableFunctions();
    return functions.find(func => func.key === key);
  }

  // Get functions available for a specific subscription tier (async version)
  async getFunctionsForTier(tier: string): Promise<AIFunction[]> {
    const functions = await this.getAvailableFunctions();
    return functions.filter(func => 
      func.availableForTiers.includes(tier)
    );
  }
}

export const aiFunctionsService = new AIFunctionsService();
import { OpenAI } from 'openai';

interface Variable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

interface AIPromptTemplate {
  id: string;
  name: string;
  type: string;
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  isDefault: boolean;
  variables?: Variable[];
}

interface AIGenerationRequest {
  functionType: string;
  variables: Record<string, any>;
  customPrompt?: string;
  customModel?: string;
}

class AIConfigService {
  private openai: OpenAI;
  
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Get AI function configuration by type
  getConfigByType(type: string): AIPromptTemplate | null {
    // Mock data for now - in real implementation, this would query the database
    const mockConfigs: AIPromptTemplate[] = [
      {
        id: '1',
        name: 'Générateur de Description',
        type: 'description',
        systemPrompt: 'Tu es un expert en marketing éditorial. Tu écris des descriptions de livres captivantes et professionnelles.',
        userPromptTemplate: 'Créez une description marketing attractive pour le livre "{title}" dans le genre {genre}. Public cible: {target_audience}. La description doit être en {language} et faire environ 150-200 mots.',
        model: 'gpt-4o',
        maxTokens: 500,
        temperature: 0.7,
        isActive: true,
        isDefault: true,
        variables: [
          { name: 'title', description: 'Titre du livre', type: 'text', required: true },
          { name: 'genre', description: 'Genre du livre', type: 'select', options: ['Fiction', 'Non-fiction', 'Romance', 'Thriller'], required: true },
          { name: 'target_audience', description: 'Public cible', type: 'text', required: false },
          { name: 'language', description: 'Langue', type: 'select', options: ['Français', 'English'], required: false }
        ]
      },
      {
        id: '2',
        name: 'Générateur de Structure',
        type: 'structure',
        systemPrompt: 'Tu es un consultant éditorial expert en structuration de livres. Tu créés des plans détaillés et logiques.',
        userPromptTemplate: 'Créez un plan détaillé pour le livre "{title}" dans le genre {genre}. Le livre doit faire environ {pages} pages. Incluez les chapitres principaux avec un résumé de chaque section.',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.6,
        isActive: true,
        isDefault: true,
        variables: [
          { name: 'title', description: 'Titre du livre', type: 'text', required: true },
          { name: 'genre', description: 'Genre du livre', type: 'text', required: true },
          { name: 'pages', description: 'Nombre de pages', type: 'number', required: false }
        ]
      },
      {
        id: '3',
        name: 'Générateur de Marketing',
        type: 'marketing',
        systemPrompt: 'Tu es un spécialiste du marketing éditorial. Tu créés du contenu promotionnel efficace pour les livres.',
        userPromptTemplate: 'Créez du contenu marketing pour promouvoir le livre "{title}" de {author}. Incluez: 1) Un pitch elevator de 30 secondes, 2) 3 posts pour réseaux sociaux, 3) Une annonce publicitaire courte.',
        model: 'gpt-4o-mini',
        maxTokens: 800,
        temperature: 0.8,
        isActive: true,
        isDefault: true,
        variables: [
          { name: 'title', description: 'Titre du livre', type: 'text', required: true },
          { name: 'author', description: 'Nom de l\'auteur', type: 'text', required: true }
        ]
      }
    ];

    return mockConfigs.find(config => config.type === type && config.isActive) || null;
  }

  // Replace variables in prompt template
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, String(value || `[${key}]`));
    });

    return result;
  }

  // Generate AI content using configuration
  async generateContent(request: AIGenerationRequest): Promise<{
    content: string;
    tokensUsed: number;
    cost: number;
    model: string;
  }> {
    const config = this.getConfigByType(request.functionType);
    
    if (!config) {
      throw new Error(`No active configuration found for function type: ${request.functionType}`);
    }

    // Use custom model if provided, otherwise use config model
    const model = request.customModel || config.model;
    
    // Build the prompt
    const systemPrompt = this.replaceVariables(config.systemPrompt, request.variables);
    const userPrompt = request.customPrompt || this.replaceVariables(config.userPromptTemplate, request.variables);

    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;
      
      // Calculate cost (approximate pricing)
      const cost = this.calculateCost(model, completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0);

      return {
        content,
        tokensUsed,
        cost,
        model
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  // Calculate approximate cost based on model and token usage
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Pricing per 1K tokens (approximate as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4': { input: 0.03, output: 0.06 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4o']; // Default to gpt-4o pricing
    
    const inputCost = (promptTokens / 1000) * modelPricing.input;
    const outputCost = (completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  // Get available variables for a function type
  getVariablesForFunction(functionType: string): Variable[] {
    const config = this.getConfigByType(functionType);
    return config?.variables || [];
  }

  // Get all available AI functions
  getAvailableFunctions(): { type: string; name: string; description: string }[] {
    return [
      { type: 'description', name: 'Description de Livre', description: 'Génère des descriptions marketing attractives' },
      { type: 'structure', name: 'Structure de Livre', description: 'Crée un plan détaillé du livre' },
      { type: 'marketing', name: 'Contenu Marketing', description: 'Génère du contenu promotionnel' },
      { type: 'title', name: 'Titre de Livre', description: 'Propose des titres accrocheurs' },
      { type: 'keywords', name: 'Mots-clés', description: 'Génère des mots-clés pour le référencement' },
      { type: 'synopsis', name: 'Synopsis', description: 'Crée un résumé professionnel' },
      { type: 'blurb', name: 'Quatrième de Couverture', description: 'Texte pour la couverture arrière' }
    ];
  }
}

export const aiConfigService = new AIConfigService();
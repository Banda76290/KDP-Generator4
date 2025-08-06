import { OpenAI } from 'openai';
import { databaseFieldsService, type DatabaseField } from './databaseFieldsService';

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
  context: {
    bookId?: string;
    projectId?: string;
    userId?: string;
  };
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
        systemPrompt: 'Tu es un expert en marketing éditorial. Tu écris des descriptions de livres captivantes et professionnelles qui convertissent les lecteurs potentiels en acheteurs.',
        userPromptTemplate: 'Créez une description marketing attractive pour le livre "{title}" dans la catégorie {primaryCategory}. Public cible: {targetAudience}. La description doit être écrite en {language} et faire environ 150-200 mots. Prix: {ebookPrice}€. Mots-clés à intégrer naturellement: {keywords}.',
        model: 'gpt-4o',
        maxTokens: 500,
        temperature: 0.7,
        isActive: true,
        isDefault: true
      },
      {
        id: '2',
        name: 'Générateur de Structure',
        type: 'structure',
        systemPrompt: 'Tu es un consultant éditorial expert en structuration de livres. Tu créés des plans détaillés et logiques qui guident efficacement le processus d\'écriture.',
        userPromptTemplate: 'Créez un plan détaillé pour le livre "{title}" (sous-titre: {subtitle}) dans la catégorie {primaryCategory}. Le livre doit faire environ {manuscriptPages} pages et {expectedLength} mots. Public cible: {targetAudience}. Incluez les chapitres principaux avec un résumé de chaque section et les points clés à développer.',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.6,
        isActive: true,
        isDefault: true
      },
      {
        id: '3',
        name: 'Générateur de Marketing',
        type: 'marketing',
        systemPrompt: 'Tu es un spécialiste du marketing éditorial. Tu créés du contenu promotionnel efficace qui génère des ventes et engage l\'audience cible.',
        userPromptTemplate: 'Créez du contenu marketing pour promouvoir le livre "{bookFullTitle}" de {fullAuthorName}. Prix: {ebookPrice}€ (eBook), {paperbackPrice}€ (papier). Catégorie: {primaryCategory}. Public cible: {targetAudience}. Incluez: 1) Un pitch elevator de 30 secondes, 2) 3 posts pour réseaux sociaux, 3) Une annonce publicitaire courte, 4) Email de lancement.',
        model: 'gpt-4o-mini',
        maxTokens: 800,
        temperature: 0.8,
        isActive: true,
        isDefault: true
      }
    ];

    return mockConfigs.find(config => config.type === type && config.isActive) || null;
  }

  // Replace variables in prompt template using database values
  private async replaceVariables(template: string, context: { bookId?: string; projectId?: string; userId?: string }): Promise<string> {
    // Get field values from database
    const fieldValues = await databaseFieldsService.getFieldValues(context);
    
    // Replace variables in template
    return databaseFieldsService.replaceVariables(template, fieldValues);
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
    const systemPrompt = await this.replaceVariables(config.systemPrompt, request.context);
    const userPrompt = request.customPrompt || await this.replaceVariables(config.userPromptTemplate, request.context);

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

  // Get available database fields for a function type
  getVariablesForFunction(functionType: string): DatabaseField[] {
    return databaseFieldsService.getAvailableFields();
  }

  // Get fields grouped by category
  getFieldsByCategory(): Record<string, DatabaseField[]> {
    return databaseFieldsService.getFieldsByCategory();
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
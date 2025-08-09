import OpenAI from "openai";
import { storage } from "../storage.ts";
import { ContentRecommendation, Book } from "../../shared/schema.ts";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

export interface AIGenerationResult {
  content: string;
  tokensUsed: number;
}

class AIService {
  async generateContent(type: string, prompt: string, bookTitle?: string): Promise<AIGenerationResult> {
    if (!openai) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.");
    }
    
    try {
      let systemPrompt = "";
      let userPrompt = prompt;

      switch (type) {
        case "structure":
          systemPrompt = "You are an expert book structure advisor. Generate detailed book structures with chapters and sections. Respond with JSON in this format: { 'title': string, 'chapters': [{ 'title': string, 'sections': string[] }] }";
          userPrompt = `Create a comprehensive book structure for: ${bookTitle || "the book"}. User request: ${prompt}`;
          break;

        case "description":
          systemPrompt = "You are a professional book marketing copywriter. Create compelling book descriptions that attract readers and improve sales.";
          userPrompt = `Write an engaging book description for: ${bookTitle || "the book"}. Requirements: ${prompt}`;
          break;

        case "marketing":
          systemPrompt = "You are a book marketing expert. Create marketing copy, taglines, and promotional content that drives book sales.";
          userPrompt = `Create marketing content for: ${bookTitle || "the book"}. Requirements: ${prompt}`;
          break;

        case "chapters":
          systemPrompt = "You are a professional author and editor. Generate detailed chapter outlines with key points and structure. Respond with JSON in this format: { 'chapters': [{ 'title': string, 'outline': string, 'keyPoints': string[] }] }";
          userPrompt = `Create detailed chapter outlines for: ${bookTitle || "the book"}. Requirements: ${prompt}`;
          break;

        default:
          systemPrompt = "You are a helpful writing assistant for authors. Provide clear, actionable advice and content.";
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: type === "structure" || type === "chapters" ? { type: "json_object" } : undefined,
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || "";
      const tokensUsed = completion.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed
      };

    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async generateBookCover(prompt: string, bookTitle?: string): Promise<{ url: string }> {
    try {
      const coverPrompt = `Create a professional book cover design for "${bookTitle || "a book"}". ${prompt}. The image should be suitable for a book cover with clear title space and professional appearance.`;

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: coverPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return { url: response.data[0].url || "" };
    } catch (error) {
      console.error("OpenAI image generation error:", error);
      throw new Error(`Cover generation failed: ${error.message}`);
    }
  }

  async improvText(text: string, improvements: string): Promise<AIGenerationResult> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a professional editor and writing coach. Improve the given text based on the specific requirements provided."
          },
          {
            role: "user",
            content: `Please improve this text: "${text}"\n\nImprovements needed: ${improvements}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.5,
      });

      const content = completion.choices[0].message.content || "";
      const tokensUsed = completion.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed
      };
    } catch (error) {
      console.error("OpenAI text improvement error:", error);
      throw new Error(`Text improvement failed: ${error.message}`);
    }
  }

  async generateContentRecommendations(book: Book, userId: string): Promise<ContentRecommendation[]> {
    if (!openai) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.");
    }

    try {
      const bookContext = this.buildBookContext(book);
      const recommendations: ContentRecommendation[] = [];

      // Generate different types of recommendations
      const recommendationTypes = [
        { type: "keywords", title: "Keyword Optimization" },
        { type: "categories", title: "Category Suggestions" },
        { type: "title", title: "Title Enhancement" },
        { type: "description", title: "Description Improvement" },
        { type: "marketing", title: "Marketing Strategy" },
        { type: "pricing", title: "Pricing Optimization" }
      ];

      for (const recType of recommendationTypes) {
        try {
          const prompt = this.buildRecommendationPrompt(recType.type, bookContext);
          
          const completion = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              { 
                role: "system", 
                content: "You are an expert publishing consultant with deep knowledge of Amazon KDP and book marketing. Provide specific, actionable recommendations based on the book data provided. Respond with JSON in the format: { 'suggestion': string, 'reasoning': string, 'confidence': number }"
              },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 500,
            temperature: 0.7,
          });

          const response = JSON.parse(completion.choices[0].message.content || "{}");
          const tokensUsed = completion.usage?.total_tokens || 0;

          if (response.suggestion && response.reasoning) {
            const recommendation = await storage.createContentRecommendation({
              userId,
              bookId: book.id,
              recommendationType: recType.type,
              title: recType.title,
              suggestion: response.suggestion,
              reasoning: response.reasoning,
              confidence: Math.min(1, Math.max(0, response.confidence || 0.7)),
              aiModel: "gpt-4o",
              tokensUsed,
              metadata: { originalValue: this.getOriginalValue(book, recType.type) }
            });

            recommendations.push(recommendation);
          }
        } catch (error) {
          console.error(`Error generating ${recType.type} recommendation:`, error);
          // Continue with other recommendations even if one fails
        }
      }

      return recommendations;
    } catch (error) {
      console.error("Error generating content recommendations:", error);
      throw new Error(`Content recommendations generation failed: ${error.message}`);
    }
  }

  private buildBookContext(book: Book): string {
    const context = [
      `Title: ${book.title || 'N/A'}`,
      `Subtitle: ${book.subtitle || 'N/A'}`,
      `Description: ${book.description || 'N/A'}`,
      `Language: ${book.language || 'English'}`,
      `Format: ${book.format}`,
      `Categories: ${book.categories?.join(', ') || 'None'}`,
      `Keywords: ${book.keywords?.join(', ') || 'None'}`,
      `Primary Marketplace: ${book.primaryMarketplace || 'Amazon.com'}`,
      `Reading Age: ${book.readingAgeMin || 'N/A'} - ${book.readingAgeMax || 'N/A'}`,
      `Status: ${book.status || 'draft'}`,
      `Low Content: ${book.isLowContentBook ? 'Yes' : 'No'}`,
      `Large Print: ${book.isLargePrintBook ? 'Yes' : 'No'}`,
      `Explicit Content: ${book.hasExplicitContent ? 'Yes' : 'No'}`
    ];

    if (book.seriesTitle) {
      context.push(`Series: ${book.seriesTitle} #${book.seriesNumber || 1}`);
    }

    return context.join('\n');
  }

  private buildRecommendationPrompt(type: string, bookContext: string): string {
    const basePrompt = `Analyze this book and provide a specific recommendation for ${type}:\n\n${bookContext}\n\n`;

    switch (type) {
      case "keywords":
        return `${basePrompt}Recommend 7 high-impact keywords that would improve discoverability on Amazon KDP. Focus on keywords that potential readers would search for. Consider genre, target audience, and current trends.`;
      
      case "categories":
        return `${basePrompt}Suggest the most effective Amazon KDP categories for this book. Consider the format, content type, and target audience. Recommend specific category paths that would maximize visibility.`;
      
      case "title":
        return `${basePrompt}Analyze the current title and suggest improvements that would increase click-through rates and searchability. Consider genre conventions, target audience expectations, and SEO benefits.`;
      
      case "description":
        return `${basePrompt}Recommend improvements to the book description that would increase conversion rates. Focus on hook, benefits, social proof, and call-to-action elements.`;
      
      case "marketing":
        return `${basePrompt}Suggest marketing strategies specific to this book's genre and target audience. Include promotional tactics, audience targeting, and platform recommendations.`;
      
      case "pricing":
        return `${basePrompt}Recommend optimal pricing strategy considering the book's format, length, genre, and competition. Include considerations for launch pricing and long-term strategy.`;
      
      default:
        return `${basePrompt}Provide general recommendations to improve this book's commercial success.`;
    }
  }

  private getOriginalValue(book: Book, type: string): any {
    switch (type) {
      case "keywords":
        return book.keywords || [];
      case "categories":
        return book.categories || [];
      case "title":
        return book.title || "";
      case "description":
        return book.description || "";
      case "pricing":
        return book.publicationInfo || {};
      default:
        return null;
    }
  }
}

export const aiService = new AIService();

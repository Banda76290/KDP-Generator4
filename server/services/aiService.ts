import OpenAI from "openai";

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
}

export const aiService = new AIService();

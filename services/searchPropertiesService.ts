
import { GoogleGenAI } from "@google/genai";
import { AgentSearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Robust retry wrapper for Gemini API calls to handle transient 503/429 errors.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorMsg = error?.message?.toLowerCase() || "";
      const isRetryable = 
        errorMsg.includes('overloaded') || 
        errorMsg.includes('503') || 
        errorMsg.includes('429') || 
        errorMsg.includes('unavailable');

      if (isRetryable && attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`Gemini overloaded. Retrying in ${backoff}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Maximum retries reached for Gemini API.");
}

/**
 * AI Agent for searching properties based on natural language queries.
 */
export const searchPropertiesAgent = async (query: string): Promise<AgentSearchResult> => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Search for properties and real estate information based on this request: "${query}". 
        CRITICAL: Focus exclusively on listings and activity from the last 90 days. 
        
        If you find specific property listings, format them clearly using this structure for each:
        ### [STATUS] Address
        - **Price**: [Price amount]
        - **Attributes**: [Beds/Baths/Cars]
        - **Features**: [Brief list of key features]
        - **Listed**: [Approximate date or recentness]
        
        Use STATUS values like: SOLD, FOR SALE, FOR RENT, or LEASED.
        Ensure the address is clearly in the heading.
        
        Start with a short summary of what you found, then list the properties, and end with a market insight.`,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      return {
        answer: response.text || "No specific listings found.",
        sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as any) || []
      };
    } catch (error: any) {
      console.error("Agent Search API Call Error:", error);
      throw error;
    }
  });
};


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
        model: 'gemini-3-flash-preview',
        contents: `Search for real-time property listings and market activity for: "${query}". 
        
        CRITICAL: 
        1. Prioritize results from the last 90 days.
        2. Format property listings using this EXACT structure:
           ### [STATUS] FULL_STREET_ADDRESS, SUBURB, STATE
           - Price: [Exact Price or 'Price on request']
           - Attributes: [Beds/Baths/Cars]
           - Land Size: [e.g. 800sqm, if available]
           - Summary: [Brief narrative description/highlight of the property]
           - Listed: [Approximate date/timeline]
           
        STATUS options: SOLD, FOR SALE, FOR RENT, or LEASED.
        
        The ADDRESS must be complete enough for Google Maps geocoding. 
        Start with a data-driven overview of the current market activity for this area.`,
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

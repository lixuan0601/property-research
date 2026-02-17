
import { GoogleGenAI } from "@google/genai";
import { AgentSearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enhanced retry wrapper for Gemini API calls.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 4): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorMsg = error?.message?.toLowerCase() || "";
      const status = error?.status || "";
      const isRetryable = 
        errorMsg.includes('overloaded') || 
        errorMsg.includes('503') || 
        errorMsg.includes('429') || 
        status === 'UNAVAILABLE' ||
        status === 'RESOURCE_EXHAUSTED';

      if (isRetryable && attempt < maxRetries) {
        const backoff = (Math.pow(2, attempt) * 1500) + (Math.random() * 1000);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Market Intelligence service is currently at capacity.");
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
        
        CRITICAL INSTRUCTIONS:
        1. Target properties listed or sold in the LAST 90 DAYS.
        2. Format every property with a header ### [STATUS] ADDRESS.
        3. Extract the following details for EVERY listing:
           - Price: [Exact Price or 'Price on request']
           - Type: [House/Unit/Townhouse/etc.]
           - Beds: [Number]
           - Baths: [Number]
           - Cars: [Number of parking spaces]
           - Land: [Size in sqm/acres]
           - Lat: [Decimal Latitude]
           - Lng: [Decimal Longitude]
           - Features: [List containing specific flags: POOL, SOLAR, BATTERY, TENNIS, DECK, BALCONY, SHED, GRANNY FLAT if present]
           - Summary: [Detailed highlights]
           - Domain: [Direct domain.com.au URL from search results]
           - REA: [Direct realestate.com.au URL from search results]
           
        STATUS options: SOLD, FOR SALE, FOR RENT, or LEASED.
        Ensure your URLs are from actual search results to avoid 404s.`,
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

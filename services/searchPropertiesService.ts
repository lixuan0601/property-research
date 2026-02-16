
import { GoogleGenAI } from "@google/genai";
import { AgentSearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enhanced retry wrapper for Gemini API calls to handle transient 503/429 errors.
 * Uses jittered exponential backoff for better reliability during high demand.
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
      const code = error?.code;
      
      const isRetryable = 
        errorMsg.includes('overloaded') || 
        errorMsg.includes('503') || 
        errorMsg.includes('429') || 
        errorMsg.includes('unavailable') ||
        status === 'UNAVAILABLE' ||
        status === 'RESOURCE_EXHAUSTED' ||
        code === 503 ||
        code === 429;

      if (isRetryable && attempt < maxRetries) {
        // Backoff: 3s, 6s, 12s + jitter
        const backoff = (Math.pow(2, attempt) * 1500) + (Math.random() * 1000);
        console.warn(`Gemini API Busy (Attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(backoff)}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Market Intelligence service is currently at capacity. Please try again in 1-2 minutes.");
}

/**
 * AI Agent for searching properties based on natural language queries.
 * Specifically optimized for Australian real estate portal URL extraction.
 */
export const searchPropertiesAgent = async (query: string): Promise<AgentSearchResult> => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search for real-time property listings and market activity for: "${query}". 
        
        CRITICAL INSTRUCTIONS:
        1. Target properties listed or sold in the LAST 90 DAYS.
        2. Use Google Search to find the EXACT "Property Profile" or "Listing" URL on Domain.com.au and Realestate.com.au for every property.
        3. DO NOT Guess or Guess-construct URLs. Only provide URLs you actually see in the search results to avoid 404 errors.
        
        URL SEARCH GUIDELINES:
        - For Domain: Look for URLs containing "domain.com.au/property-profile/" or "domain.com.au/street-number-street-name...".
        - For REA: Look for URLs containing "realestate.com.au/property-address..." or "realestate.com.au/property/".

        4. FORMAT EVERY PROPERTY ENTRY EXACTLY AS BELOW:
           ### [STATUS] FULL_STREET_ADDRESS, SUBURB, STATE, POSTCODE
           - Price: [Exact Price or 'Price on request']
           - Attributes: [Beds/Baths/Cars]
           - Land Size: [e.g. 800sqm, if available]
           - Summary: [Detailed highlights. Mention pool, solar, battery, etc.]
           - Listed: [Date or timeline]
           - Domain: [Paste the direct domain.com.au URL found via search]
           - REA: [Paste the direct realestate.com.au URL found via search]
           
        STATUS options: SOLD, FOR SALE, FOR RENT, or LEASED.
        
        If you cannot find a direct profile link, provide the most relevant search result URL for that specific address on that portal.`,
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

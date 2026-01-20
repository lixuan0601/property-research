
import { GoogleGenAI } from "@google/genai";
import { AgentSearchResult } from "../types";

// Initialize GoogleGenAI with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * AI Agent for searching properties based on natural language queries.
 * Optimized for speed and search grounding accuracy using Gemini 2.5 Flash.
 */
export const searchPropertiesAgent = async (query: string): Promise<AgentSearchResult> => {
  try {
    // Using gemini-2.5-flash for fast agentic responses and search grounding support
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search for properties and real estate information based on this request: "${query}". Focus on listings from the last 90 days. Summarize the best matches found, including addresses, features, and pricing if available.`,
      config: {
        tools: [{ googleSearch: {} }],
        // Disable thinking to ensure the agent responds as fast as possible
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return {
      answer: response.text || "No specific listings found.",
      // Cast SDK response to our GroundingChunk type
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as any) || []
    };
  } catch (error) {
    console.error("Agent Search Error:", error);
    throw new Error("AI Agent failed to search properties.");
  }
};

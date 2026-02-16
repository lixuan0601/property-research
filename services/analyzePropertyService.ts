
import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingChunk, SectionProgress } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Robust retry wrapper for individual analysis tasks.
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
        const backoff = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached");
}

/**
 * Deep analysis for a specific property address.
 */
export const analyzeProperty = async (
  address: string,
  onProgress?: (progress: SectionProgress) => void
): Promise<SearchResult> => {
  try {
    const modelId = "gemini-3-flash-preview"; 
    const config = {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 0 },
    };

    const basePrompt = `Quick analysis for: "${address}". Use Google Search.`;

    const tasks = [
      {
        key: 'overview',
        label: 'Property Overview',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 🏠 Property Overview
          Return these details in this EXACT format:
          - Type: [Value]
          - Bedrooms: [Number]
          - Bathrooms: [Number]
          - Living Areas: [Number]
          - Carport Spaces: [Number]
          - Land Size: [Value]
          - Building Size: [Value]
          - Building Coverage: [Value]
          - Ground Elevation: [Value]
          - Roof Height: [Value]
          - Solar Power: [Value]
          - Listing Status: [Status]
          - Key Features: [Comma list]
          - Latitude: [Decimal]
          - Longitude: [Decimal]`
      },
      {
        key: 'investment',
        label: 'Investment Insights',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 💡 Investment & Value Insights
          Format exactly:
          - Metric: Estimated Value, Property: [Value], Suburb_Average: [Value], Comparison: [Above/Below/Average]
          - Metric: Estimated Rental, Property: [Value], Suburb_Average: [Value], Comparison: [Above/Below/Average]
          - Metric: Rental Yield, Property: [Value], Suburb_Average: [Value], Comparison: [Above/Below/Average]
          - Metric: Market Interest, Property: [Value], Suburb_Average: [Value], Comparison: [Above/Below/Average]

          **Comparable Properties**
          Search for the 5 most recent comparable sales.
          MANDATORY FORMAT for each comparable (one per line):
          - Address: [Address], Sold_Price: [Price], Sold_Date: [Date], Features: [Summary], Lat: [Value], Lng: [Value]
          
          CRITICAL: You must provide the exact Latitude (Lat) and Longitude (Lng) for EVERY comparable property found.`
      },
      {
        key: 'history',
        label: 'Price History',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 📈 Price History
          Search all real estate platforms (domain.com.au, realestate.com.au, property.com.au, onthehouse.com.au) for COMPLETE historical price data. 
          Find every listing event: Listed for Sale, Sold, Listed for Rent, and Leased. 
          Return ALL detected records in this EXACT format (one per line):
          - Date: YYYY-MM-DD, Price: [Value], Type: [Sale/Rent], Event: [Event Description]`
      },
      {
        key: 'suburb',
        label: 'Suburb Profile',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 🏘️ Suburb Profile
          Analyze neighborhood vibe.
          
          ### Demographics & Community
          [Content]
          
          ### Lifestyle & Atmosphere
          [Content]
          
          ### Connectivity & Convenience
          [Content]`
      },
      {
        key: 'schools',
        label: 'School Catchment',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 🎓 School Catchment
          Find school ratings.
          **FORMAT:**
          - Name: [Name], Type: [Type], Rating: [Score], Distance: [Distance]`
      }
    ];

    tasks.forEach(task => {
      if (onProgress) {
        onProgress({ key: task.key, label: task.label, status: 'pending', startTime: Date.now() });
      }
    });

    const promises = tasks.map(async (task) => {
      const startTime = Date.now();
      try {
        const result = await withRetry(async () => {
          return await ai.models.generateContent({
            model: modelId,
            contents: task.prompt,
            config: config,
          });
        });
        
        if (onProgress) onProgress({ key: task.key, label: task.label, status: 'completed', startTime, endTime: Date.now() });
        return result;
      } catch (err) {
        console.error(`Task ${task.key} failed after retries:`, err);
        if (onProgress) onProgress({ key: task.key, label: task.label, status: 'error', startTime, endTime: Date.now() });
        return { text: `\n## ${task.key.toUpperCase()} ERROR\nData currently unavailable due to high server load.`, candidates: [] } as any;
      }
    });

    const responses = await Promise.all(promises);
    let fullText = "";
    let allGroundingChunks: GroundingChunk[] = [];

    responses.forEach(response => {
      if (response.text) fullText += response.text + "\n\n";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) allGroundingChunks = [...allGroundingChunks, ...(chunks as any)];
    });

    return { text: fullText, groundingChunks: allGroundingChunks };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze property.");
  }
};

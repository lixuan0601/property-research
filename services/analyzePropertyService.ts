
import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingChunk, SectionProgress } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorMsg = error?.message?.toLowerCase() || "";
      const isRetryable = errorMsg.includes('overloaded') || errorMsg.includes('503') || errorMsg.includes('429');
      if (isRetryable && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached");
}

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
          Return details in this EXACT format:
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
          - Address: [Address], Sold_Price: [Price], Sold_Date: [Date], Type: [House/Unit/Townhouse], Beds: [N], Baths: [N], Cars: [N], Land: [Size], Lat: [Lat], Lng: [Lng], Features: [Flags like POOL, SOLAR, BATTERY, TENNIS, DECK, BALCONY, SHED, GRANNY FLAT]`
      },
      {
        key: 'history',
        label: 'Price History',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 📈 Price History
          - Date: YYYY-MM-DD, Price: [Value], Type: [Sale/Rent], Event: [Event Description]`
      },
      {
        key: 'suburb',
        label: 'Suburb Profile',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 🏘️ Suburb Profile
          Analyze neighborhood demographics and vibe.`
      },
      {
        key: 'schools',
        label: 'School Catchment',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 🎓 School Catchment
          - Name: [Name], Type: [Type], Rating: [Score], Distance: [Distance]`
      }
    ];

    const promises = tasks.map(async (task) => {
      const startTime = Date.now();
      if (onProgress) onProgress({ key: task.key, label: task.label, status: 'pending', startTime });
      try {
        const result = await withRetry(() => ai.models.generateContent({
          model: modelId,
          contents: task.prompt,
          config: config,
        }));
        if (onProgress) onProgress({ key: task.key, label: task.label, status: 'completed', startTime, endTime: Date.now() });
        return result;
      } catch (err) {
        if (onProgress) onProgress({ key: task.key, label: task.label, status: 'error', startTime, endTime: Date.now() });
        return { text: `\n## ${task.key} Error\nUnavailable.`, candidates: [] } as any;
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
    throw new Error("Failed to analyze property.");
  }
};

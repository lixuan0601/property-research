
import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingChunk, SectionProgress } from "../types";

// Initialize GoogleGenAI with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Deep analysis for a specific property address.
 * Optimized for maximum speed using Gemini 3 Flash with thinking disabled.
 */
export const analyzeProperty = async (
  address: string,
  onProgress?: (progress: SectionProgress) => void
): Promise<SearchResult> => {
  try {
    // Using gemini-3-flash-preview for the fastest possible response times
    const modelId = "gemini-3-flash-preview"; 
    const config = {
      tools: [{ googleSearch: {} }],
      // Disable thinking budget to reduce latency and generate immediate output
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
          List 5 recent sales in this EXACT format (one per line):
          - Address: [Address], Sold_Price: [Price], Sold_Date: [Date], Features: [Summary], Lat: [Value], Lng: [Value]`
      },
      {
        key: 'history',
        label: 'Price History',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 📈 Price History
          Search all real estate platforms (domain.com.au, realestate.com.au, property.com.au) for the COMPLETE historical price data of this property. 
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
        const result = await ai.models.generateContent({
          model: modelId,
          contents: task.prompt,
          config: config,
        });
        if (onProgress) onProgress({ key: task.key, label: task.label, status: 'completed', startTime, endTime: Date.now() });
        return result;
      } catch (err) {
        if (onProgress) onProgress({ key: task.key, label: task.label, status: 'error', startTime, endTime: Date.now() });
        return { text: `\n## ${task.key.toUpperCase()} ERROR\nData unavailable.`, candidates: [] } as any;
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

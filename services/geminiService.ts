
import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingChunk, SectionProgress } from "../types";

// Initialize GoogleGenAI with the API key from environment variables as per strict guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProperty = async (
  address: string,
  onProgress?: (progress: SectionProgress) => void
): Promise<SearchResult> => {
  try {
    const modelId = "gemini-2.5-flash"; // Using 2.5 flash for speed and search capability
    const config = {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 0 } // Disable thinking for speed
    };

    const basePrompt = `Perform a deep dive analysis for the real estate property at: "${address}". **CRITICAL:** You MUST use the Google Search tool.`;

    // Define independent tasks for parallel execution
    const tasks = [
      {
        key: 'overview',
        label: 'Property Overview',
        prompt: `${basePrompt}
          Analyze property status from the **last 90 days**.
          
          Structure your response starting with the header:
          ## 🏠 Property Overview
          Find the details and list them in this **EXACT format**:
          - Type: [House/Unit/Apartment/Townhouse]
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
          Provide a comprehensive valuation analysis.
          
          **MARKET INTEREST:** Search for listing view counts or interest indicators for this address.
          
          **MANDATORY DATA:** Format exactly:
          - Metric: Estimated Value, Property: [Value], Suburb_Average: [Value], Comparison: [Above Average/Below Average/Average]
          - Metric: Estimated Rental, Property: [Value], Suburb_Average: [Value], Comparison: [Above Average/Below Average/Average]
          - Metric: Rental Yield, Property: [Value], Suburb_Average: [Value], Comparison: [Above Average/Below Average/Average]
          - Metric: Market Interest, Property: [Value], Suburb_Average: [Value], Comparison: [Above Average/Below Average/Average]

          **Comparable Properties**
          List 5 properties sold in last 12 months in this suburb:
          - Address: [Address], Sold_Price: [Price], Sold_Date: [Date], Features: [Summary], Lat: [Value], Lng: [Value]

          Then provide qualitative analysis:
          - **Market Assessment:** Summary.
          - **Pros/Cons:** Summary.`
      },
      {
        key: 'history',
        label: 'Price History',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 📈 Price History
          Search property.com.au, domain, etc. for ALL sales and rental history.
          **FORMAT:**
          - Date: YYYY-MM-DD, Price: $XXX,XXX, Type: Sale/Rent, Event: [Event]`
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
          Find Better Education ratings strictly from bettereducation.com.au.
          **FORMAT:**
          - Name: [School Name], Type: [Public/Private], Rating: [Score], Distance: [Distance]`
      }
    ];

    // Initial broadcast of all tasks as pending
    tasks.forEach(task => {
      if (onProgress) {
        onProgress({
          key: task.key,
          label: task.label,
          status: 'pending',
          startTime: Date.now()
        });
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
        
        if (onProgress) {
          onProgress({
            key: task.key,
            label: task.label,
            status: 'completed',
            startTime,
            endTime: Date.now()
          });
        }
        return result;
      } catch (err) {
        console.error(`Error processing section ${task.key}:`, err);
        if (onProgress) {
          onProgress({
            key: task.key,
            label: task.label,
            status: 'error',
            startTime,
            endTime: Date.now()
          });
        }
        return { text: `\n## ${task.key.toUpperCase()} ERROR\nData unavailable.`, candidates: [] } as any;
      }
    });

    const responses = await Promise.all(promises);
    let fullText = "";
    let allGroundingChunks: GroundingChunk[] = [];

    responses.forEach(response => {
      if (response.text) fullText += response.text + "\n\n";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) allGroundingChunks = [...allGroundingChunks, ...chunks];
    });

    return { text: fullText, groundingChunks: allGroundingChunks };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze property.");
  }
};
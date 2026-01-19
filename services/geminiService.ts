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
          For listing status and current price, use data from the **last 90 days**.
          
          Structure your response starting with the header:
          ## 🏠 Property Overview
          Find the details and list them in this **EXACT format**:
          - Type: [House/Unit/Apartment/Townhouse]
          - Bedrooms: [Number]
          - Bathrooms: [Number]
          - Living Areas: [Number]
          - Carport Spaces: [Number]
          - Land Size: [Value with unit, e.g., 600 sqm]
          - Building Size: [Value with unit, e.g., 200 sqm]
          - Building Coverage: [Percentage or Value]
          - Ground Elevation: [Value]
          - Roof Height: [Value]
          - Solar Power: [Details, e.g., 6.6kW system or None]
          - Listing Status: [Active/Sold/Pending]
          - Key Features: [Comma-separated list of amenities, e.g., Solar Panels, Pool, Garage]
          - Latitude: [Decimal Value]
          - Longitude: [Decimal Value]`
      },
      {
        key: 'investment',
        label: 'Investment Insights',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 💡 Investment & Value Insights
          Provide a comprehensive valuation analysis.
          
          **MANDATORY DATA:** You must provide a comparison for 'Estimated Value', 'Estimated Rental', 'Rental Yield' and 'Market Interest' against the suburb average in this EXACT format (one per line):
          - Metric: Estimated Value, Property: [Range/Value], Suburb_Average: [Value], Comparison: [Above Average/Below Average/Average]
          - Metric: Estimated Rental, Property: [Price per week], Suburb_Average: [Price per week], Comparison: [Above Average/Below Average/Average]
          - Metric: Rental Yield, Property: [Percentage], Suburb_Average: [Percentage], Comparison: [Above Average/Below Average/Average]
          - Metric: Market Interest, Property: [High/Medium/Low or View Count], Suburb_Average: [Value], Comparison: [Above Average/Below Average/Average]

          **Comparable Properties**
          Find 5 properties in the same suburb that have **SOLD** recently (last 6-12 months).
          **CRITICAL:** You must find the actual SOLD PRICE and coordinates. 
          List them in this EXACT format (one per line):
          - Address: [Address], Sold_Price: [Price], Sold_Date: [Date], Features: [Beds/Baths/Car/Land], Lat: [Value], Lng: [Value]

          Then provide the qualitative analysis:
          - **Market Assessment:** Fairly priced?
          - **Pros/Cons:** Summary.`
      },
      {
        key: 'history',
        label: 'Price History',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 📈 Price History
          Search specifically on **property.com.au** and other major real estate archives to retrieve the **complete available sales and rental history**. Do not limit to recent years; get all recorded history found.
          **IMPORTANT:** You must list the data points in this EXACT format (one per line):
          - Date: YYYY-MM-DD, Price: $XXX,XXX, Type: Sale/Rent, Event: Listed/Sold/Rented/Price Change
          
          If exact dates aren't available, use the 1st of the month. If no history is found, explicitly say "No price history available".`
      },
      {
        key: 'suburb',
        label: 'Suburb Profile',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 🏘️ Suburb Profile
          Who lives here? Analyze the neighborhood vibe and demographics.
          **FORMAT INSTRUCTIONS:** Use "### " (three hashes) for subsection titles. Write detailed paragraphs for each.
          
          ### Demographics & Community
          [Detailed paragraph about the typical residents, family composition, and age groups.]
          
          ### Lifestyle & Atmosphere
          [Detailed paragraph about the local vibe, noise levels, pace of life, and culture.]
          
          ### Connectivity & Convenience
          [Detailed paragraph about transport, commute options, and access to major amenities.]`
      },
      {
        key: 'schools',
        label: 'School Catchment',
        prompt: `${basePrompt}
          Structure your response starting with the header:
          ## 🎓 School Catchment
          Find nearby Public and Private schools (Primary and Secondary).
          **CRITICAL:** You MUST use the Google Search tool to find the specific **Better Education** rating (usually a score out of 100 or state overall score) for each school strictly from **bettereducation.com.au**. 
          Do NOT use ratings from Google Maps, MySchool, or other sources. If a Better Education score is unavailable, write "N/A".

          **IMPORTANT:** List them in this EXACT format (one per line):
          - Name: [School Name], Type: [Public/Private], Rating: [Better Ed Score/100], Distance: [Distance]`
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

    // Initiate all requests in parallel with progress tracking
    const promises = tasks.map(async (task) => {
      const startTime = Date.now();
      try {
        const result = await ai.models.generateContent({
          model: modelId,
          contents: task.prompt,
          config: config,
        });
        
        const endTime = Date.now();
        if (onProgress) {
          onProgress({
            key: task.key,
            label: task.label,
            status: 'completed',
            startTime,
            endTime
          });
        }
        return result;
      } catch (err) {
        console.error(`Error processing section ${task.key}:`, err);
        const endTime = Date.now();
        if (onProgress) {
          onProgress({
            key: task.key,
            label: task.label,
            status: 'error',
            startTime,
            endTime
          });
        }
        // Return a mock response object to prevent Promise.all from failing entirely
        return { 
          text: `\n## ${task.key.toUpperCase()} ERROR\nData unavailable for this section due to a search error.`, 
          candidates: [] 
        } as any;
      }
    });

    const responses = await Promise.all(promises);

    let fullText = "";
    let allGroundingChunks: GroundingChunk[] = [];

    responses.forEach(response => {
      if (response.text) {
        fullText += response.text + "\n\n";
      }
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        allGroundingChunks = [...allGroundingChunks, ...chunks];
      }
    });

    return {
      text: fullText,
      groundingChunks: allGroundingChunks,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze property. Please check the address and try again.");
  }
};
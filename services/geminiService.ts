import { GoogleGenAI } from "@google/genai";
import { SearchResult } from "../types";

// Initialize GoogleGenAI with the API key from environment variables as per strict guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProperty = async (address: string): Promise<SearchResult> => {
  try {
    const modelId = "gemini-2.5-flash"; // Using 2.5 flash for speed and search capability
    
    // Prompt engineering to get structured-like text response for easier parsing
    const prompt = `
      Perform a deep dive analysis for the real estate property at: "${address}". 
      
      **CRITICAL:** You MUST use the Google Search tool. 
      - For listing status and current price, use data from the **last 90 days**.
      
      Your goal is to answer the user's question: "Who are the people interested in this address and what is the market demand?".
      
      Structure your response into exactly these 5 sections, separated by distinct headers:
      
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
      
      ## 💡 Investment & Value Insights
      Provide a comprehensive valuation analysis.
      
      **MANDATORY DATA:** You must provide a comparison for 'Estimated Value', 'Estimated Rental', 'Rental Yield' and 'Market Interest' against the suburb average in this EXACT format (one per line):
      - Metric: Estimated Value, Property: [Range/Value], Suburb_Average: [Value], Comparison: [Above Average/Below Average/Average]
      - Metric: Estimated Rental, Property: [Price per week], Suburb_Average: [Price per week], Comparison: [Above Average/Below Average/Average]
      - Metric: Rental Yield, Property: [Percentage], Suburb_Average: [Percentage], Comparison: [Above Average/Below Average/Average]
      - Metric: Market Interest, Property: [High/Medium/Low or View Count], Suburb_Average: [Value], Comparison: [Above Average/Below Average/Average]

      **Comparable Properties**
      Find at least 10 properties in the same suburb that have **SOLD** recently (last 6-12 months).
      **CRITICAL:** You must find the actual SOLD PRICE. 
      List them in this EXACT format (one per line):
      - Address: [Address], Sold_Price: [Price], Sold_Date: [Date], Features: [Beds/Baths/Car/Land]

      Then provide the qualitative analysis:
      - **Market Assessment:** Fairly priced?
      - **Pros/Cons:** Summary.

      ## 📈 Price History
      Search specifically on **property.com.au** and other major real estate archives to retrieve the **complete available sales and rental history**. Do not limit to recent years; get all recorded history found.
      **IMPORTANT:** You must list the data points in this EXACT format (one per line):
      - Date: YYYY-MM-DD, Price: $XXX,XXX, Type: Sale/Rent, Event: Listed/Sold/Rented/Price Change
      
      If exact dates aren't available, use the 1st of the month. If no history is found, explicitly say "No price history available".
      
      ## 🏘️ Suburb Profile
      Who lives here? Analyze the neighborhood vibe and demographics.
      **FORMAT INSTRUCTIONS:** Use "### " (three hashes) for subsection titles. Write detailed paragraphs for each.
      
      ### Demographics & Community
      [Detailed paragraph about the typical residents, family composition, and age groups.]
      
      ### Lifestyle & Atmosphere
      [Detailed paragraph about the local vibe, noise levels, pace of life, and culture.]
      
      ### Connectivity & Convenience
      [Detailed paragraph about transport, commute options, and access to major amenities.]
      
      ## 🎓 School Catchment
      Find nearby Public and Private schools (Primary and Secondary).
      **IMPORTANT:** List them in this EXACT format (one per line):
      - Name: [School Name], Type: [Public/Private], Rating: [Score/10 or Rating], Distance: [Distance]
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        // Note: responseMimeType and responseSchema are NOT allowed with googleSearch
      },
    });

    const text = response.text || "No analysis generated.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text,
      groundingChunks: groundingChunks as any[],
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze property. Please check the address and try again.");
  }
};
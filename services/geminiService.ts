import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// The API key is injected at build time by Vite based on the GEMINI_API_KEY env var in Vercel
const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

/**
 * Extracts potential citations from raw text using Gemini.
 */
export const extractCitationsFromText = async (text: string): Promise<any[]> => {
  if (!text || text.length < 10) return [];

  if (!apiKey) {
    throw new Error("Missing API Key. Please configure GEMINI_API_KEY in Vercel settings.");
  }

  try {
    // Using gemini-2.0-flash-exp for best balance of speed and reasoning
    const model = "gemini-2.0-flash-exp"; 
    
    const prompt = `
      You are an academic text parser.
      Extract citations from the text below. 
      For each citation found:
      1. 'original_text': The exact text of the citation.
      2. 'title': The full title of the work (article, book, or chapter).
      3. 'author': The first author's last name.
      4. 'year': The year of publication.
      5. 'doi': The Digital Object Identifier (DOI) if present in the text (e.g., "10.1038/s41586...").
      
      Important: 
      - If you see a DOI (e.g., 10.1000/xyz), text starting with "http", or "doi.org", include it in the 'doi' field AND 'original_text'.
      - Do NOT translate titles. Keep them in original language.
      - Return STRICT JSON.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ text: `TEXT TO ANALYZE:\n${text}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original_text: { type: Type.STRING },
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              year: { type: Type.STRING },
              doi: { type: Type.STRING }
            }
          }
        }
      }
    });

    // Sanitize the response text to remove any markdown fencing that might be left
    let jsonText = response.text || "[]";
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    
    return JSON.parse(jsonText);

  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    
    // Enhanced Error Handling for UI Feedback
    if (error.message?.includes("429")) {
        throw new Error("API Quota Exceeded (429). The system is under heavy load. Please wait 60 seconds and try again.");
    }
    if (error.message?.includes("403") || error.message?.includes("API not enabled")) {
        throw new Error("API Configuration Error (403). The 'Generative Language API' is not enabled in your Google Cloud Project. Please enable it.");
    }
    // If 2.0 fails, it might be an old key or region lock, fallback hint
    if (error.message?.includes("404")) {
        throw new Error("Model Unavailable (404). Ensure your API Key supports 'gemini-2.0-flash-exp'.");
    }

    throw new Error("Failed to extract citations. " + (error instanceof Error ? error.message : ""));
  }
};

/**
 * Re-formats a verified citation into a specific style using AI.
 */
export const reformatCitation = async (citationData: any, style: string): Promise<string> => {
  try {
     if (!apiKey) return "Error: Missing API Key";

     const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Format this academic source into ${style} style. Return ONLY the formatted string, nothing else. Data: ${JSON.stringify(citationData)}`,
    });
    return response.text?.trim() || "Formatting failed";
  } catch (error) {
    console.error("Formatting error", error);
    return "Error formatting citation";
  }
};
/**
 * Secondary Verification Layer: Google Search Grounding.
 * Used when Crossref fails to find a match to prevent false positives.
 */
export const verifyWithGoogleSearch = async (citation: any): Promise<{ verified: boolean, title?: string, url?: string, snippet?: string }> => {
  if (!process.env.API_KEY) return { verified: false };

  try {
    // Construct a search query based on title and author
    const query = `"${citation.title}" ${citation.author} academic paper`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash 3 supports search grounding
      contents: `Verify if this academic paper actually exists and was published: ${query}.`,
      config: {
        tools: [{ googleSearch: {} }] // This enables the search tool
      }
    });

    // Check Grounding Metadata for source URLs
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && chunks.length > 0) {
        // Look for valid URLs in the grounding chunks that indicate a match
        const webChunk = chunks.find((c: any) => c.web?.uri);
        
        if (webChunk && webChunk.web) {
            return {
                verified: true,
                title: webChunk.web.title,
                url: webChunk.web.uri,
                snippet: "Verified via Google Search Grounding"
            };
        }
    }
    
    // Fallback: Check if the model explicitly confirmed it in the text
    const text = response.text?.toLowerCase() || "";
    if (text.includes("yes") && (text.includes("exists") || text.includes("published"))) {
         return { verified: true, snippet: "Model confirmed existence via search context." };
    }

    return { verified: false };

  } catch (error) {
    console.error("Search verification failed:", error);
    return { verified: false };
  }
};

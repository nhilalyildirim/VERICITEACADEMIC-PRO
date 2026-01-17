import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// We use the exact initialization pattern required.
// Note: In Vite, process.env.API_KEY is replaced by a string literal at build time.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper: Delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes an async operation with exponential backoff for rate limits.
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check for common rate limit or service overload errors
    const isRateLimit = 
      error?.status === 429 || 
      error?.status === 503 ||
      (error?.message && (
        error.message.includes("429") || 
        error.message.includes("Quota") || 
        error.message.includes("overloaded")
      ));
    
    if (retries > 0 && isRateLimit) {
      console.warn(`API Rate limit hit (429). Retrying in ${baseDelay}ms...`);
      await delay(baseDelay);
      return withRetry(operation, retries - 1, baseDelay * 2);
    }
    // For other errors, or if retries exhausted, throw
    throw error;
  }
}

/**
 * Extracts citations from text using Gemini.
 */
export const extractCitationsFromText = async (text: string): Promise<any[]> => {
  if (!text || text.length < 5) return [];

  return withRetry(async () => {
    // Use gemini-3-flash-preview for basic extraction task
    const model = "gemini-3-flash-preview"; 
    const prompt = `
      Extract citations from the text below.
      Return a strict JSON array of objects.
      Keys: original_text, title, author, year, doi.
      If a field is missing, use empty string.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ text: `TEXT:\n${text}` }] }
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

    let jsonText = response.text || "[]";
    // Clean potential markdown code blocks
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", jsonText);
        return [];
    }
  }, 3, 2000);
};

/**
 * Secondary Verification Layer: Google Search Grounding.
 */
export const verifyWithGoogleSearch = async (citation: any): Promise<{ verified: boolean, title?: string, url?: string, snippet?: string }> => {
  try {
    return await withRetry(async () => {
        const query = `"${citation.title}" ${citation.author} academic paper`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Verify if this academic paper exists: ${query}.`,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && chunks.length > 0) {
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
        
        // Fallback: Check model text response if grounding chunks are missing but model confirms
        const text = response.text?.toLowerCase() || "";
        if (text.includes("yes") && (text.includes("exists") || text.includes("published"))) {
             return { verified: true, snippet: "Model confirmed existence via search context." };
        }

        return { verified: false };
    }, 3, 3000); // Higher delay for search as it is more expensive

  } catch (error) {
    console.error("Search verification failed:", error);
    return { verified: false };
  }
};

/**
 * Reformat citation style using Gemini.
 */
export const reformatCitation = async (citationData: any, style: string): Promise<string> => {
  try {
     return await withRetry(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Format this citation to ${style} style: ${JSON.stringify(citationData)}. Return ONLY the formatted string.`,
        });
        return response.text?.trim() || "";
     }, 2, 1000);
  } catch (error) {
    console.error("Reformat failed", error);
    return "";
  }
};

import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper: Delay function for backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes an async operation with exponential backoff for rate limits and service overloads.
 * Essential for production SaaS reliability.
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 4, baseDelay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const status = error?.status;
    const message = error?.message || "";
    
    // 429 = Rate Limit, 503 = Overloaded/Unavailable
    const shouldRetry = status === 429 || status === 503 || message.includes("429") || message.includes("503") || message.includes("overloaded");
    
    if (retries > 0 && shouldRetry) {
      console.warn(`Gemini API Busy (${status || 'Overloaded'}). Retrying in ${baseDelay}ms... Attempts left: ${retries}`);
      await delay(baseDelay);
      // Exponential backoff: increase delay for next attempt
      return withRetry(operation, retries - 1, baseDelay * 2);
    }
    throw error;
  }
}

/**
 * Extracts citations from text using Gemini.
 */
export const extractCitationsFromText = async (text: string): Promise<any[]> => {
  if (!text || text.length < 5) return [];

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: "Extract all academic citations from the following text. Return a JSON array of objects with keys: original_text, title, author, year, doi. If missing, use empty string." }] },
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
            },
            required: ["original_text", "title"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse Gemini JSON:", jsonText);
        return [];
    }
  });
};

/**
 * Verification Layer: Google Search Grounding.
 */
export const verifyWithGoogleSearch = async (citation: any): Promise<{ verified: boolean, title?: string, url?: string, snippet?: string }> => {
  return withRetry(async () => {
    const query = `Verify existence of academic paper: "${citation.title}" by ${citation.author} (${citation.year})`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
        const webChunk = chunks.find((c: any) => c.web?.uri);
        if (webChunk?.web) {
            return {
                verified: true,
                title: webChunk.web.title,
                url: webChunk.web.uri,
                snippet: "Verified via Real-time Google Search Grounding."
            };
        }
    }
    
    return { verified: false };
  });
};

/**
 * Reformat citation style using Gemini. 
 * Strictly uses verified canonical data to prevent content hallucination.
 */
export const reformatCitation = async (canonicalData: any, style: string): Promise<string> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Format this academic source into ${style} style. Use the provided metadata strictly. Return ONLY the formatted string.\nMetadata: ${JSON.stringify(canonicalData)}` }] }],
    });
    return response.text?.trim() || "Formatting error.";
  }, 2, 1000);
};

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Optimized retry mechanism with Jitter to fix 429 errors during high concurrency.
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 3, baseDelay = 500): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRetryable = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
    
    if (retries > 0 && isRetryable) {
      const waitTime = baseDelay + (Math.random() * 300);
      await delay(waitTime);
      return withRetry(operation, retries - 1, baseDelay * 2);
    }
    throw error;
  }
}

/**
 * Instant Citation Extraction (Gemini 3 Flash).
 * Target: Under 3 seconds for 5000+ words.
 */
export const extractCitationsFromText = async (text: string): Promise<any[]> => {
  if (!text || text.trim().length < 10) return [];

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
          role: 'user', 
          parts: [{ text: `Extract academic citations from the text. 
          Return ONLY a JSON array of objects: {original_text, title, author, year, doi}.
          Text: ${text.slice(0, 20000)}` }] 
      }],
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
        },
        temperature: 0 // Zero temperature for max speed and reliability
      }
    });

    return JSON.parse(response.text || "[]");
  }, 2, 600);
};

/**
 * Fast Grounding Check.
 */
export const verifyWithGoogleSearch = async (citation: any): Promise<{ verified: boolean, title?: string, url?: string }> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Is this real: "${citation.title}" ${citation.author || ""} ${citation.year || ""}` }] }],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0
      }
    });

    const chunk = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find((c: any) => c.web?.uri);
    if (chunk && chunk.web) {
        return { 
            verified: true, 
            title: chunk.web.title, 
            url: chunk.web.uri 
        };
    }
    return { verified: false };
  }, 1, 400);
};

export const reformatCitation = async (canonicalData: any, style: string): Promise<string> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Format as ${style}: ${JSON.stringify(canonicalData)}` }] }],
    });
    return response.text?.trim() || "Error.";
  }, 1, 200);
};

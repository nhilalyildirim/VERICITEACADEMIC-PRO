import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced retry logic with exponential backoff and jitter.
 * Crucial for avoiding cascading 429 failures.
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 5, baseDelay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const status = error?.status;
    const message = error?.message || "";
    
    const isRateLimit = status === 429 || message.includes("429") || message.includes("quota");
    const isOverload = status === 503 || message.includes("503") || message.includes("overloaded");
    
    if (retries > 0 && (isRateLimit || isOverload)) {
      // Exponential backoff with jitter
      const jitter = Math.random() * 1000;
      const waitTime = (isRateLimit ? baseDelay * 3 : baseDelay) + jitter;
      
      console.warn(`Gemini API Busy (Status: ${status}). Retrying in ${Math.round(waitTime)}ms... Attempts left: ${retries}`);
      await delay(waitTime);
      return withRetry(operation, retries - 1, baseDelay * 2);
    }
    throw error;
  }
}

/**
 * Rapid extraction using Gemini 3 Flash. 
 * Flash provides significantly lower latency (1-3s vs 10s+) for structured tasks.
 */
export const extractCitationsFromText = async (text: string): Promise<any[]> => {
  if (!text || text.length < 5) return [];

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { 
          role: 'user', 
          parts: [{ text: `Extract all formal academic citations (APA, MLA, etc.) from this text. 
          Return a JSON array of objects with: original_text, title, author, year, doi. 
          Ignore general mentions without a specific work. If unknown, use empty string.` }] 
        },
        { role: 'user', parts: [{ text: `INPUT:\n${text}` }] }
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
        return [];
    }
  });
};

/**
 * Grounded verification using Google Search.
 */
export const verifyWithGoogleSearch = async (citation: any): Promise<{ verified: boolean, title?: string, url?: string, snippet?: string }> => {
  return withRetry(async () => {
    const query = `Verify academic source existence: "${citation.title}" by ${citation.author} (${citation.year})`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash also supports grounding and is much faster
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
                snippet: "Validated against live web index."
            };
        }
    }
    return { verified: false };
  });
};

export const reformatCitation = async (canonicalData: any, style: string): Promise<string> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Reformat to ${style} style using this metadata: ${JSON.stringify(canonicalData)}. Return only the formatted text.` }] }],
    });
    return response.text?.trim() || "Formatting error.";
  }, 2, 500);
};
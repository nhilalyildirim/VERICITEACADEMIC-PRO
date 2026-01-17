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
    // We use gemini-2.0-flash-exp as it is the current valid experimental model.
    // The previous 'gemini-2.5' model name was causing 404 errors.
    const model = "gemini-2.0-flash-exp"; 
    
    const prompt = `
      You are an academic text parser.
      Extract citations from the text below. 
      For each citation found:
      1. 'original_text': The exact text of the citation.
      2. 'title': The full title of the work (article, book, or chapter).
      3. 'author': The first author's last name.
      4. 'year': The year of publication.
      
      Important: 
      - If you see a DOI (e.g., 10.1000/xyz), text starting with "http", or "doi.org", include it in the 'original_text' to help verification.
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
              year: { type: Type.STRING }
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
    if (error.message?.includes("404")) {
        throw new Error("Model Error (404). The AI model is temporarily unavailable. Please try again later.");
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
  } catch (e) {
    return "Error formatting citation";
  }
};
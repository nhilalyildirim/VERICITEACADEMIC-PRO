import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// In a real production build, ensure process.env.API_KEY is defined in your build pipeline
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

/**
 * Extracts potential citations from raw text using Gemini.
 * NOTE: We strictly instruct Gemini NOT to verify, only to extract.
 * Verification happens via the Crossref API in a separate step to prevent hallucinations.
 */
export const extractCitationsFromText = async (text: string): Promise<any[]> => {
  if (!text || text.length < 10) return [];

  try {
    const model = "gemini-2.5-flash-preview"; 
    
    const prompt = `
      You are an academic text parser. Your job is to extract citations and references from the provided text.
      
      Rules:
      1. Identify every citation, bibliography entry, or reference mentioned.
      2. Extract the Title, Author (first author last name), and Year.
      3. Do NOT invent information. If a field is missing, leave it empty.
      4. Do NOT attempt to verify validity. Just extract what is written.
      
      Return a JSON array where each object has:
      - original_text: The full string of the reference as it appears.
      - title: The inferred title of the paper/book.
      - author: The inferred primary author.
      - year: The inferred year.
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

    const jsonText = response.text;
    if (!jsonText) return [];
    
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract citations from text.");
  }
};

/**
 * Re-formats a verified citation into a specific style using AI.
 * Since the data is already verified by Crossref, AI is safe to use for formatting.
 */
export const reformatCitation = async (citationData: any, style: string): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview",
      contents: `Format this academic source into ${style} style. Return ONLY the formatted string, nothing else. Data: ${JSON.stringify(citationData)}`,
    });
    return response.text?.trim() || "Formatting failed";
  } catch (e) {
    return "Error formatting citation";
  }
};
import { Citation, VerificationStatus } from "../types";
import { verifyWithGoogleSearch } from "./geminiService";

const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

// Levenshtein Distance for typo tolerance
const getLevenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
};

const calcLevenshteinSim = (s1: string, s2: string): number => {
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  const longer = n1.length > n2.length ? n1 : n2;
  if (longer.length === 0) return 1.0;
  return (longer.length - getLevenshteinDistance(n1, n2)) / longer.length;
};

export const verifyCitationWithCrossref = async (extracted: any): Promise<Citation> => {
  const exTitle = extracted.title || "";
  const exAuthor = extracted.author || "";
  const exDoi = extracted.doi || "";

  // 1. DOI Check (Fastest)
  if (exDoi && exDoi.includes('10.')) {
     try {
        const cleanDoi = exDoi.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/)?.[0];
        if (cleanDoi) {
            const res = await fetch(`https://api.crossref.org/works/${cleanDoi}`);
            if (res.ok) {
                const data = await res.json();
                return createVerified(extracted, data.message, 100, "Matched via DOI (Crossref).");
            }
        }
     } catch (e) { /* ignore */ }
  }
  
  // 2. Crossref Metadata Search
  let bestMatch = null;
  let maxScore = 0;

  if (exTitle.length > 5) {
      try {
        const query = `${exTitle} ${exAuthor}`;
        const response = await fetch(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=3`);
        if (response.ok) {
            const data = await response.json();
            const items = data.message?.items || [];

            for (const item of items) {
                const dbTitle = item.title?.[0] || "";
                const score = calcLevenshteinSim(exTitle, dbTitle);
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = item;
                }
            }
        }
      } catch (error) {
        console.warn("Crossref search failed", error);
      }
  }

  // 3. Evaluation & FALLBACK to Google Search
  const confidence = Math.min(Math.round(maxScore * 100), 100);

  if (maxScore > 0.75) {
      return createVerified(extracted, bestMatch, confidence, "Verified via Crossref.");
  }

  // --- FALLBACK: GOOGLE SEARCH GROUNDING ---
  // If Crossref score is low, use Gemini with Search tool to prevent False Positives.
  const searchResult = await verifyWithGoogleSearch(extracted);
  
  if (searchResult.verified) {
      return {
          id: Math.random().toString(36).substr(2, 9),
          originalText: extracted.original_text,
          extractedTitle: extracted.title,
          extractedAuthor: extracted.author,
          extractedYear: extracted.year,
          status: VerificationStatus.VERIFIED,
          confidenceScore: 90, // High confidence if Google finds it
          databaseMatch: {
              source: 'Google Search',
              title: searchResult.title || extracted.title,
              url: searchResult.url || '',
              publishedDate: 'Unknown'
          },
          analysisNotes: `Verified via Google Search. ${searchResult.snippet || ''}`
      };
  }

  if (maxScore > 0.5) {
      return createCitation(extracted, VerificationStatus.AMBIGUOUS, confidence, 
        `Possible match: "${bestMatch?.title?.[0]}". Please verify manually.`);
  }

  return createCitation(extracted, VerificationStatus.HALLUCINATED, confidence, 
      "Source not found in Crossref or Google Search.");
};

const createCitation = (ex: any, status: VerificationStatus, score: number, notes: string): Citation => ({
    id: Math.random().toString(36).substr(2, 9),
    originalText: ex.original_text,
    extractedTitle: ex.title,
    extractedAuthor: ex.author,
    extractedYear: ex.year,
    status,
    confidenceScore: score,
    databaseMatch: { source: 'None' },
    analysisNotes: notes
});

const createVerified = (ex: any, item: any, score: number, notes: string): Citation => ({
    id: Math.random().toString(36).substr(2, 9),
    originalText: ex.original_text,
    extractedTitle: ex.title,
    extractedAuthor: ex.author,
    extractedYear: ex.year,
    status: VerificationStatus.VERIFIED,
    confidenceScore: score,
    databaseMatch: {
        source: 'Crossref',
        doi: item.DOI,
        title: item.title?.[0],
        url: item.URL || `https://doi.org/${item.DOI}`,
        publishedDate: item.created?.['date-parts']?.[0]?.join('-') || 'Unknown'
    },
    analysisNotes: notes
});

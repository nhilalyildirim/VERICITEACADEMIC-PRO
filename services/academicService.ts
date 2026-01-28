import { Citation, VerificationStatus } from "../types";
import { verifyWithGoogleSearch } from "./geminiService";

const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Standard word-based Jaccard similarity for academic titles.
 */
const calcSimilarity = (s1: string, s2: string): number => {
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  if (n1 === n2) return 1.0;
  if (!n1 || !n2) return 0;
  const words1 = new Set(n1.split(' '));
  const words2 = new Set(n2.split(' '));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
};

export const verifyCitationParallel = async (extracted: any): Promise<Citation> => {
  const { title, author, doi } = extracted;
  let crMatch = null;

  // PHASE 1: Authority Metadata Check (Crossref)
  // Non-throttled, highly reliable academic index.
  try {
      if (doi && doi.includes('10.')) {
          const cleanDoi = doi.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/)?.[0];
          if (cleanDoi) {
              const res = await fetch(`https://api.crossref.org/works/${cleanDoi}`, { priority: 'high' });
              if (res.ok) crMatch = (await res.json()).message;
          }
      }
      
      if (!crMatch && title && title.length > 10) {
          const query = encodeURIComponent(`${title} ${author || ''}`);
          const res = await fetch(`https://api.crossref.org/works?query.bibliographic=${query}&rows=1`);
          if (res.ok) {
              const items = (await res.json()).message?.items;
              if (items && items.length > 0) {
                  const topMatch = items[0];
                  const sim = calcSimilarity(title, topMatch.title?.[0] || "");
                  // If Crossref has a very strong title match, we use it as the authority
                  if (sim > 0.7) crMatch = topMatch;
              }
          }
      }
  } catch (e) {
      console.warn(`[AcademicService] Metadata Phase failed: ${e}`);
  }

  // PHASE 2: Confidence Evaluation
  if (crMatch) {
      const matchTitle = crMatch.title?.[0] || "";
      const similarity = calcSimilarity(title, matchTitle);
      
      // OPTIMIZATION: If we have > 90% confidence from Crossref, SKIP Google Grounding.
      // This is the single biggest performance gain (saves 5-10s per citation).
      if (similarity > 0.90) {
          return createVerified(extracted, {
              source: 'Crossref',
              doi: crMatch.DOI,
              title: matchTitle,
              url: crMatch.URL || `https://doi.org/${crMatch.DOI}`,
              publishedDate: crMatch.created?.['date-parts']?.[0]?.join('-') || 'Unknown'
          }, Math.round(similarity * 100), "Verified against Crossref authority index.");
      }
  }

  // PHASE 3: Grounding (Fallback for missing or low-confidence metadata)
  // Only triggered if Phase 1 was inconclusive.
  try {
      const googleMatch = await verifyWithGoogleSearch(extracted);
      if (googleMatch && googleMatch.verified) {
          return createVerified(extracted, {
              source: 'Google Search',
              title: googleMatch.title || title,
              url: googleMatch.url || '',
              publishedDate: 'Index Verified'
          }, 95, `Verified via live search grounding: ${googleMatch.snippet || 'Located in external academic registry.'}`);
      }
  } catch (e) {
      console.warn(`[AcademicService] Grounding Phase failed: ${e}`);
  }

  // PHASE 4: Negative Result
  return {
      id: Math.random().toString(36).substr(2, 9),
      originalText: extracted.original_text,
      status: VerificationStatus.HALLUCINATED,
      confidenceScore: 0,
      analysisNotes: "UNVERIFIED. This work could not be located in academic metadata indexes or verified through web-based grounding tools. Exercise extreme caution."
  } as Citation;
};

const createVerified = (ex: any, dbMatch: any, score: number, notes: string): Citation => ({
    id: Math.random().toString(36).substr(2, 9),
    originalText: ex.original_text,
    extractedTitle: dbMatch.title,
    extractedAuthor: ex.author,
    extractedYear: ex.year,
    status: VerificationStatus.VERIFIED,
    confidenceScore: score,
    databaseMatch: dbMatch,
    analysisNotes: notes
});
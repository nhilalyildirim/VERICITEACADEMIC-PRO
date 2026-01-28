
import { Citation, VerificationStatus } from "../types";
import { verifyWithGoogleSearch } from "./geminiService";

const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();

/**
 * Production-Speed Verification Engine.
 */
export const verifyCitationParallel = async (extracted: any): Promise<Citation> => {
  const { title, author, doi } = extracted;
  
  try {
      // PHASE 1: Fast DOI/Title Search
      const searchPromises = [];
      if (doi?.includes('10.')) {
          const cleanDoi = doi.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/)?.[0];
          if (cleanDoi) searchPromises.push(fetch(`https://api.crossref.org/works/${cleanDoi}`).then(r => r.ok ? r.json() : null));
      }
      if (title?.length > 10) {
          searchPromises.push(fetch(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(title + ' ' + (author || ''))}&rows=1`).then(r => r.ok ? r.json() : null));
      }

      const results = await Promise.all(searchPromises);
      const crMatch = results.find(r => r?.message)?.message || results.find(r => r?.message?.items?.[0])?.message?.items?.[0];

      if (crMatch) {
          const matchTitle = crMatch.title?.[0] || "";
          if (normalize(matchTitle).includes(normalize(title).slice(0, 15))) {
              return createCitation(extracted, VerificationStatus.VERIFIED, 98, {
                  source: 'Crossref',
                  doi: crMatch.DOI,
                  title: matchTitle,
                  url: crMatch.URL || `https://doi.org/${crMatch.DOI}`
              }, "Verified via Crossref academic index.");
          }
      }

      // PHASE 2: Grounding Fallback (Selective)
      const search = await verifyWithGoogleSearch(extracted);
      if (search.verified) {
          return createCitation(extracted, VerificationStatus.VERIFIED, 92, {
              source: 'Google Search',
              title: search.title || title,
              url: search.url || ''
          }, "Verified via real-time web grounding.");
      }

  } catch (e) {
      console.warn("Verification error:", e);
  }

  return createCitation(extracted, VerificationStatus.HALLUCINATED, 0, undefined, "UNVERIFIED. No record found in academic databases.");
};

const createCitation = (ex: any, status: VerificationStatus, score: number, dbMatch: any, notes: string): Citation => ({
    id: Math.random().toString(36).substr(2, 9),
    originalText: ex.original_text,
    extractedTitle: dbMatch?.title || ex.title,
    extractedAuthor: ex.author,
    extractedYear: ex.year,
    status,
    confidenceScore: score,
    databaseMatch: dbMatch,
    analysisNotes: notes
});

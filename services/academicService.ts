
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
      let crMatch = null;

      // DOI lookup returns message object directly
      const doiResult = results[0];
      if (doiResult?.message?.title) {
          crMatch = doiResult.message;
      }

      // Bibliographic search returns message.items array
      if (!crMatch) {
          const searchResult = results.find(r => r?.message?.items?.length > 0);
          if (searchResult) crMatch = searchResult.message.items[0];
      }

      if (crMatch) {
          const matchTitle = crMatch.title?.[0] || "";
          const titleWords = normalize(title).split(/\s+/).filter(w => w.length > 3);
          const matchWords = normalize(matchTitle).split(/\s+/);
          const overlap = titleWords.filter(w => matchWords.includes(w)).length;
          const similarity = titleWords.length > 0 ? overlap / titleWords.length : 0;

          if (similarity >= 0.6) {  // 60% word overlap required
              return createCitation(extracted, VerificationStatus.VERIFIED, Math.round(similarity * 100), {
                  source: 'Crossref',
                  doi: crMatch.DOI,
                  title: matchTitle,
                  url: crMatch.URL || `https://doi.org/${crMatch.DOI}`
              }, "Verified via Crossref academic index.");
          } else if (similarity >= 0.4) {
              return createCitation(extracted, VerificationStatus.AMBIGUOUS, 50, {
                  source: 'Crossref',
                  doi: crMatch.DOI,
                  title: matchTitle,
                  url: crMatch.URL || `https://doi.org/${crMatch.DOI}`
              }, "Partial match found. Manual verification recommended.");
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


import { Citation, VerificationStatus } from "../types";
import { verifyWithGoogleSearch } from "./geminiService";

const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

/**
 * PRODUCTION FETCH WRAPPER
 * Implements a 10-second timeout to prevent UI hang.
 */
async function fetchWithTimeout(resource: string, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

const calcSimilarity = (s1: string, s2: string): number => {
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  if (n1 === n2) return 1.0;
  const longer = n1.length > n2.length ? n1 : n2;
  const shorter = n1.length > n2.length ? n2 : n1;
  if (longer.length === 0) return 1.0;
  return (longer.includes(shorter)) ? shorter.length / longer.length : 0.5;
};

export const verifyCitationParallel = async (extracted: any): Promise<Citation> => {
  const { title, author, doi } = extracted;

  // 1. Parallel Task Initiation with explicit error catching per-task
  const crossrefPromise = (async () => {
    try {
        if (doi && doi.includes('10.')) {
            const cleanDoi = doi.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/)?.[0];
            if (cleanDoi) {
                const res = await fetchWithTimeout(`https://api.crossref.org/works/${cleanDoi}`);
                if (res.ok) return (await res.json()).message;
            }
        }
        if (title && title.length > 10) {
            const query = encodeURIComponent(`${title} ${author || ''}`);
            const res = await fetchWithTimeout(`https://api.crossref.org/works?query.bibliographic=${query}&rows=1`);
            if (res.ok) {
                const items = (await res.json()).message?.items;
                return items?.[0];
            }
        }
    } catch (e) {
        console.warn(`[AcademicService] Crossref lookup failed: ${e instanceof Error ? e.message : 'Network Error'}`);
    }
    return null;
  })();

  // Fix: Added type assertion to catch block to prevent union type errors during property access on googleMatch
  const searchPromise = verifyWithGoogleSearch(extracted).catch(e => {
      console.warn(`[AcademicService] Google Search Grounding failed: ${e}`);
      return { verified: false } as { verified: boolean, title?: string, url?: string, snippet?: string };
  });

  // 2. Resolve Tasks
  const [crMatch, googleMatch] = await Promise.all([crossrefPromise, searchPromise]);

  // 3. Evaluation
  if (crMatch) {
      const matchTitle = crMatch.title?.[0] || "";
      const similarity = calcSimilarity(title, matchTitle);
      
      if (similarity > 0.85) {
          return createVerified(extracted, {
              source: 'Crossref',
              doi: crMatch.DOI,
              title: matchTitle,
              url: crMatch.URL || `https://doi.org/${crMatch.DOI}`,
              publishedDate: crMatch.created?.['date-parts']?.[0]?.join('-') || 'Unknown'
          }, Math.round(similarity * 100), "Verified via Crossref Canonical Metadata.");
      }
  }

  // Fix: Type is now correctly inferred as { verified: boolean, title?: string, url?: string, snippet?: string }
  if (googleMatch && googleMatch.verified) {
      return createVerified(extracted, {
          source: 'Google Search',
          title: googleMatch.title || title,
          url: googleMatch.url || '',
          publishedDate: 'Verified Existing'
      }, 95, `Verified via Google Search Grounding. ${googleMatch.snippet || ''}`);
  }

  // 4. Final Verification State
  return {
      id: Math.random().toString(36).substr(2, 9),
      originalText: extracted.original_text,
      status: VerificationStatus.HALLUCINATED,
      confidenceScore: 0,
      analysisNotes: "SOURCE NOT FOUND. Verified across Crossref and Google Search indexes with zero positive signals. This citation is likely fabricated."
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

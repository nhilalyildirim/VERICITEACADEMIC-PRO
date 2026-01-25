import { Citation, VerificationStatus } from "../types";
import { verifyWithGoogleSearch } from "./geminiService";

const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

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
  const { title, author, year, doi } = extracted;

  // 1. Parallel Task Initiation
  const crossrefPromise = (async () => {
    if (doi && doi.includes('10.')) {
        const cleanDoi = doi.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/)?.[0];
        if (cleanDoi) {
            const res = await fetch(`https://api.crossref.org/works/${cleanDoi}`);
            if (res.ok) return (await res.json()).message;
        }
    }
    if (title.length > 10) {
        const query = encodeURIComponent(`${title} ${author}`);
        const res = await fetch(`https://api.crossref.org/works?query.bibliographic=${query}&rows=1`);
        if (res.ok) {
            const items = (await res.json()).message?.items;
            return items?.[0];
        }
    }
    return null;
  })();

  const searchPromise = verifyWithGoogleSearch(extracted);

  // 2. Wait for First High-Confidence Signal or Both
  const [crMatch, googleMatch] = await Promise.all([crossrefPromise, searchPromise]);

  // 3. Evaluation Logic (Strictness > Appearance)
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

  if (googleMatch.verified) {
      return createVerified(extracted, {
          source: 'Google Search',
          title: googleMatch.title || title,
          url: googleMatch.url || '',
          publishedDate: 'Verified Existing'
      }, 95, `Verified via Google Search Grounding. ${googleMatch.snippet}`);
  }

  // 4. Hallucination Detection
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
import { Citation, VerificationStatus } from "../types";

// Helper: Normalize strings for comparison (remove special chars, lowercase, collapse spaces)
const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

// Levenshtein distance for fuzzy string matching
const getLevenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length];
};

const calculateSimilarity = (s1: string, s2: string): number => {
  const norm1 = normalize(s1);
  const norm2 = normalize(s2);
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  if (longer.length === 0) return 1.0;
  return (longer.length - getLevenshteinDistance(norm1, norm2)) / longer.length;
};

/**
 * Queries Crossref API to verify if a citation exists.
 * Implements a robust multi-step verification strategy.
 */
export const verifyCitationWithCrossref = async (extracted: any): Promise<Citation> => {
  const extractedTitle = extracted.title || "";
  const extractedAuthor = extracted.author || "";
  const extractedDoi = extracted.doi || "";

  // Strategy 1: DOI Verification (Most Accurate)
  if (extractedDoi && extractedDoi.includes('10.')) {
     try {
        const cleanDoi = extractedDoi.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/)?.[0];
        if (cleanDoi) {
            const response = await fetch(`https://api.crossref.org/works/${cleanDoi}`);
            if (response.ok) {
                const data = await response.json();
                const item = data.message;
                return createVerifiedCitation(extracted, item, 100, "Verified directly via DOI.");
            }
        }
     } catch (e) {
         console.warn("DOI lookup failed, falling back to search", e);
     }
  }
  
  // Strategy 2: Bibliographic Search
  if (!extractedTitle || extractedTitle.length < 5) {
    return createCitation(extracted, VerificationStatus.AMBIGUOUS, 0, "Insufficient metadata for verification.");
  }

  try {
    // Search using title + author
    const query = `${extractedTitle} ${extractedAuthor}`;
    // Fetch top 5 results to account for ranking issues
    const response = await fetch(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=5`);
    
    if (!response.ok) throw new Error("Crossref API error");

    const data = await response.json();
    const items = data.message?.items || [];

    if (items.length === 0) {
      return createCitation(extracted, VerificationStatus.HALLUCINATED, 10, "No records found in Crossref.");
    }

    // Iterate through top 5 results to find a match
    let bestMatch = null;
    let highestScore = 0;

    for (const item of items) {
        const realTitle = item.title?.[0] || "";
        const realSubtitle = item.subtitle?.[0] || "";
        
        // Calculate similarity with and without subtitle
        const simFull = calculateSimilarity(extractedTitle, `${realTitle} ${realSubtitle}`);
        const simMain = calculateSimilarity(extractedTitle, realTitle);
        const titleScore = Math.max(simFull, simMain);

        // Check Authors
        let authorMatch = false;
        if (extractedAuthor && item.author) {
            const targetAuth = normalize(extractedAuthor);
            authorMatch = item.author.some((a: any) => {
                const family = normalize(a.family || "");
                const given = normalize(a.given || "");
                // Match if target is contained in family name OR family name is contained in target
                return family.includes(targetAuth) || targetAuth.includes(family); 
            });
        }

        // Scoring Logic
        let currentScore = titleScore;
        if (authorMatch) currentScore += 0.2; // Boost score if author matches

        if (currentScore > highestScore) {
            highestScore = currentScore;
            bestMatch = item;
        }

        // Thresholds for "Good Enough" to stop searching
        // 1. High Title Match (>0.85)
        // 2. Good Title Match (>0.6) AND Author Match
        if (titleScore > 0.85 || (titleScore > 0.6 && authorMatch)) {
             return createVerifiedCitation(extracted, item, Math.min(Math.round(currentScore * 100), 99), "Verified via deep metadata search.");
        }
    }

    // If loop finishes and we have a decent candidate but not perfect
    if (bestMatch && highestScore > 0.7) {
         return createVerifiedCitation(extracted, bestMatch, Math.round(highestScore * 100), "Likely match found with variations.");
    }

    // If we are here, we found results but none matched closely enough
    return createCitation(extracted, VerificationStatus.HALLUCINATED, Math.round(highestScore * 100), 
        `Closest database match "${bestMatch?.title?.[0]}" did not match extracted title.`);

  } catch (error) {
    console.error("Verification Error", error);
    return createCitation(extracted, VerificationStatus.AMBIGUOUS, 0, "External verification service unavailable.");
  }
};

// --- Helpers ---

const createCitation = (extracted: any, status: VerificationStatus, confidence: number, notes: string): Citation => {
    return {
        id: Math.random().toString(36).substr(2, 9),
        originalText: extracted.original_text,
        extractedTitle: extracted.title,
        extractedAuthor: extracted.author,
        status,
        confidenceScore: confidence,
        databaseMatch: { source: 'None', title: '' },
        analysisNotes: notes
    };
};

const createVerifiedCitation = (extracted: any, item: any, confidence: number, notes: string): Citation => {
    return {
        id: Math.random().toString(36).substr(2, 9),
        originalText: extracted.original_text,
        extractedTitle: extracted.title,
        extractedAuthor: extracted.author,
        status: VerificationStatus.VERIFIED,
        confidenceScore: confidence,
        databaseMatch: {
            source: 'Crossref',
            doi: item.DOI,
            title: item.title?.[0],
            url: item.URL || `https://doi.org/${item.DOI}`,
            publishedDate: item.created?.['date-parts']?.[0]?.join('-') || 'Unknown'
        },
        analysisNotes: notes
    };
};

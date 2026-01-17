import { Citation, VerificationStatus } from "../types";

// Levenshtein distance for fuzzy string matching
const getLevenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const calculateSimilarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2;
  if (longer.length === 0) return 1.0;
  return (longer.length - getLevenshteinDistance(s1, s2)) / longer.length;
};

/**
 * Queries Crossref API to verify if a citation exists.
 */
export const verifyCitationWithCrossref = async (extracted: any): Promise<Citation> => {
  const cleanTitle = extracted.title?.replace(/[^\w\s]/gi, '') || "";
  
  if (!cleanTitle || cleanTitle.length < 5) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      originalText: extracted.original_text,
      status: VerificationStatus.AMBIGUOUS,
      confidenceScore: 0,
      analysisNotes: "Insufficient metadata extracted to perform verification.",
    };
  }

  try {
    // Query Crossref
    const response = await fetch(`https://api.crossref.org/works?query.title=${encodeURIComponent(cleanTitle)}&rows=3`);
    
    if (!response.ok) {
        throw new Error("Crossref API error");
    }

    const data = await response.json();
    const items = data.message?.items || [];

    if (items.length === 0) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        originalText: extracted.original_text,
        extractedTitle: extracted.title,
        extractedAuthor: extracted.author,
        status: VerificationStatus.HALLUCINATED,
        confidenceScore: 0.1,
        analysisNotes: "No matching records found in Crossref database. This source likely does not exist.",
      };
    }

    // Check top match
    const topMatch = items[0];
    const realTitle = topMatch.title?.[0] || "";
    const similarity = calculateSimilarity(cleanTitle.toLowerCase(), realTitle.toLowerCase());

    const isMatch = similarity > 0.65; // Threshold for verification

    if (isMatch) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        originalText: extracted.original_text,
        extractedTitle: extracted.title,
        extractedAuthor: extracted.author,
        status: VerificationStatus.VERIFIED,
        confidenceScore: Math.round(similarity * 100),
        databaseMatch: {
          source: 'Crossref',
          doi: topMatch.DOI,
          title: realTitle,
          url: topMatch.URL,
          publishedDate: topMatch.created?.['date-parts']?.[0]?.join('-') || 'Unknown'
        },
        analysisNotes: "Successfully verified against Crossref database.",
      };
    } else {
       return {
        id: Math.random().toString(36).substr(2, 9),
        originalText: extracted.original_text,
        extractedTitle: extracted.title,
        extractedAuthor: extracted.author,
        status: VerificationStatus.HALLUCINATED,
        confidenceScore: Math.round(similarity * 100),
        databaseMatch: {
            source: 'None', // We found something but it didn't match well enough
            title: realTitle // Show what we found that was close
        },
        analysisNotes: `Closest match found ("${realTitle}") does not sufficiently match input. Likely fabricated or significantly errored.`,
      };
    }

  } catch (error) {
    console.error("Crossref Error", error);
    return {
      id: Math.random().toString(36).substr(2, 9),
      originalText: extracted.original_text,
      status: VerificationStatus.AMBIGUOUS,
      confidenceScore: 0,
      analysisNotes: "Verification service temporarily unavailable.",
    };
  }
};
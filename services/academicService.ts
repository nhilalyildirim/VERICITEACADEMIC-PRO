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
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
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
 * Uses 'query.bibliographic' to search across title, author, and container title simultaneously.
 */
export const verifyCitationWithCrossref = async (extracted: any): Promise<Citation> => {
  const cleanTitle = extracted.title?.replace(/[^\w\s]/gi, '').trim() || "";
  const cleanAuthor = extracted.author?.replace(/[^\w\s]/gi, '').trim() || "";
  
  if (!cleanTitle || cleanTitle.length < 5) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      originalText: extracted.original_text,
      status: VerificationStatus.AMBIGUOUS,
      confidenceScore: 0,
      analysisNotes: "Insufficient metadata extracted (title too short) to perform verification.",
    };
  }

  try {
    // 1. Try to search combined metadata (Author + Title) for better precision
    // query.bibliographic is much more powerful than query.title
    const query = `${cleanTitle} ${cleanAuthor}`;
    const response = await fetch(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=3`);
    
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

    // 2. Check the top result
    const topMatch = items[0];
    const realTitle = topMatch.title?.[0] || "";
    
    // Normalize strings for comparison
    const normCleanTitle = cleanTitle.toLowerCase();
    const normRealTitle = realTitle.replace(/[^\w\s]/gi, '').toLowerCase();

    // Calculate similarity
    const titleSimilarity = calculateSimilarity(normCleanTitle, normRealTitle);

    // Check Author Match (loose)
    let authorMatch = false;
    if (cleanAuthor && topMatch.author) {
        const authName = cleanAuthor.toLowerCase();
        authorMatch = topMatch.author.some((a: any) => 
            (a.family && a.family.toLowerCase().includes(authName)) || 
            (a.given && a.given.toLowerCase().includes(authName))
        );
    }

    // Verification Logic:
    // 1. High title similarity (> 0.6) = VERIFIED (Lowered from 0.65 to be more forgiving of small typos)
    // 2. Medium title similarity (> 0.4) AND Author Match = VERIFIED (Lowered from 0.45)
    
    const isVerified = titleSimilarity > 0.6 || (titleSimilarity > 0.4 && authorMatch);

    // Prioritize getting a valid URL
    const sourceUrl = topMatch.URL || topMatch.resource?.primary?.URL || (topMatch.link?.[0]?.URL) || `https://doi.org/${topMatch.DOI}`;

    if (isVerified) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        originalText: extracted.original_text,
        extractedTitle: extracted.title,
        extractedAuthor: extracted.author,
        status: VerificationStatus.VERIFIED,
        confidenceScore: Math.round(titleSimilarity * 100),
        databaseMatch: {
          source: 'Crossref',
          doi: topMatch.DOI,
          title: realTitle,
          url: sourceUrl,
          publishedDate: topMatch.created?.['date-parts']?.[0]?.join('-') || 'Unknown'
        },
        analysisNotes: "Successfully verified against Crossref database.",
      };
    } else {
       // Close but not close enough?
       return {
        id: Math.random().toString(36).substr(2, 9),
        originalText: extracted.original_text,
        extractedTitle: extracted.title,
        extractedAuthor: extracted.author,
        status: VerificationStatus.HALLUCINATED,
        confidenceScore: Math.round(titleSimilarity * 100),
        databaseMatch: {
            source: 'None', 
            title: realTitle // Return what we found so user can see why it failed
        },
        analysisNotes: `Closest match ("${realTitle}") does not sufficiently match input title/author.`,
      };
    }

  } catch (error) {
    console.error("Crossref Error", error);
    return {
      id: Math.random().toString(36).substr(2, 9),
      originalText: extracted.original_text,
      status: VerificationStatus.AMBIGUOUS,
      confidenceScore: 0,
      analysisNotes: "Verification service temporarily unavailable or network error.",
    };
  }
};
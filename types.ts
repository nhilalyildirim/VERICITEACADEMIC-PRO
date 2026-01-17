export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  HALLUCINATED = 'HALLUCINATED',
  AMBIGUOUS = 'AMBIGUOUS',
  PENDING = 'PENDING'
}

export enum CitationStyle {
  APA7 = 'APA 7',
  MLA9 = 'MLA 9',
  CHICAGO = 'Chicago',
  HARVARD = 'Harvard'
}

export interface Citation {
  id: string;
  originalText: string;
  extractedTitle?: string;
  extractedAuthor?: string;
  extractedYear?: string;
  status: VerificationStatus;
  confidenceScore: number;
  databaseMatch?: {
    source: 'Crossref' | 'Google Search' | 'OpenAlex' | 'None';
    doi?: string;
    title?: string;
    url?: string;
    publishedDate?: string;
  };
  analysisNotes: string;
}

export interface AnalysisReport {
  id: string;
  timestamp: number;
  totalCitations: number;
  verifiedCount: number;
  hallucinatedCount: number;
  overallTrustScore: number; // 0-100
  citations: Citation[];
}

export interface User {
  id: string;
  isPremium: boolean;
  analysisCount: number;
}

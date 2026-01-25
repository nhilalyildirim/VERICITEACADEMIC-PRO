import React, { useState } from 'react';
import { Check, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Copy, Loader2, Globe, Database } from 'lucide-react';
import { Citation, VerificationStatus } from '../types';
import { reformatCitation } from '../services/geminiService';

interface CitationCardProps {
  citation: Citation;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  const [expanded, setExpanded] = useState(false);
  const [formattedText, setFormattedText] = useState<string>("");
  const [loadingFormat, setLoadingFormat] = useState(false);

  const isHallucinated = citation.status === VerificationStatus.HALLUCINATED;
  const isVerified = citation.status === VerificationStatus.VERIFIED;

  const handleFormat = async (style: string) => {
      if (!isVerified || !citation.databaseMatch) return;
      setLoadingFormat(true);
      
      // Pass canonical metadata only. NEVER pass original unverified text for formatting.
      const canonicalMetadata = {
          title: citation.databaseMatch.title,
          author: citation.extractedAuthor,
          year: citation.extractedYear,
          doi: citation.databaseMatch.doi,
          url: citation.databaseMatch.url
      };
      
      const res = await reformatCitation(canonicalMetadata, style);
      setFormattedText(res);
      setLoadingFormat(false);
  };

  return (
    <div className={`border rounded-lg mb-4 transition-all ${expanded ? 'shadow-md' : 'hover:border-gray-300'}`}>
      <div 
        className={`p-4 flex items-start gap-4 cursor-pointer rounded-t-lg ${
            isVerified ? 'bg-emerald-50/50' : isHallucinated ? 'bg-rose-50/50' : 'bg-gray-50'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
          <div className="mt-1">
              {isVerified ? <Check className="w-5 h-5 text-emerald-600" /> : isHallucinated ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <HelpCircle className="w-5 h-5 text-gray-400" />}
          </div>
          <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                 <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                     isHallucinated ? 'bg-rose-100 border-rose-200 text-rose-700' : 
                     isVerified ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 
                     'bg-gray-100 border-gray-200 text-gray-700'
                 }`}>
                     {isVerified ? 'Verified Source' : isHallucinated ? 'Hallucination Detected' : 'Unknown'}
                 </span>
              </div>
              <h4 className="font-bold text-gray-900 truncate max-w-xl">
                  {citation.databaseMatch?.title || citation.extractedTitle || "No title found"}
              </h4>
              <p className="text-xs text-gray-500 italic mt-1 line-clamp-1">"{citation.originalText}"</p>
          </div>
          <div className="text-gray-400">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
      </div>

      {expanded && (
          <div className="p-5 border-t border-gray-100 bg-white rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div>
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Analysis Intelligence</h5>
                          <div className={`p-3 rounded-md text-sm leading-relaxed ${isHallucinated ? 'bg-rose-50 border border-rose-100 text-rose-800' : 'bg-gray-50 text-gray-700'}`}>
                              {citation.analysisNotes}
                          </div>
                      </div>
                      
                      {citation.databaseMatch?.url && (
                          <a href={citation.databaseMatch.url} target="_blank" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-semibold">
                              View Original Document <ExternalLink className="w-3 h-3" />
                          </a>
                      )}
                  </div>

                  {isVerified && (
                      <div className="flex flex-col">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">One-Click Formatting (Verified)</h5>
                          <div className="flex flex-wrap gap-2 mb-3">
                              {['APA 7', 'MLA 9', 'Chicago', 'Harvard'].map(s => (
                                  <button key={s} onClick={() => handleFormat(s)} className="px-2.5 py-1 text-xs font-bold border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                                      {s}
                                  </button>
                              ))}
                          </div>
                          
                          <div className="flex-grow min-h-[80px] bg-gray-50 rounded border border-dashed border-gray-200 p-3 relative group">
                            {loadingFormat ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                </div>
                            ) : formattedText ? (
                                <div className="relative">
                                    <p className="text-xs font-mono text-gray-800 break-words pr-6">{formattedText}</p>
                                    <button onClick={() => navigator.clipboard.writeText(formattedText)} className="absolute top-0 right-0 p-1 hover:bg-white rounded" title="Copy">
                                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center mt-4">Select a style to format canonical metadata.</p>
                            )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
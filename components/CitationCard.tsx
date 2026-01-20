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
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED: return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case VerificationStatus.HALLUCINATED: return 'bg-rose-50 border-rose-200 text-rose-900';
      case VerificationStatus.AMBIGUOUS: return 'bg-amber-50 border-amber-200 text-amber-900';
      default: return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
      switch (status) {
        case VerificationStatus.VERIFIED: return <Check className="w-5 h-5 text-emerald-600" />;
        case VerificationStatus.HALLUCINATED: return <AlertTriangle className="w-5 h-5 text-rose-600" />;
        default: return <HelpCircle className="w-5 h-5 text-amber-600" />;
      }
  };

  const getStatusLabel = (status: VerificationStatus) => {
      switch (status) {
        case VerificationStatus.VERIFIED: return "Verified Source";
        case VerificationStatus.HALLUCINATED: return "Likely Fabricated";
        case VerificationStatus.AMBIGUOUS: return "Ambiguous Match";
        default: return "Pending";
      }
  };

  const handleFormat = async (style: string) => {
      setLoading(true);
      const data = citation.databaseMatch?.source !== 'None' ? citation.databaseMatch : { title: citation.extractedTitle, author: citation.extractedAuthor };
      const res = await reformatCitation(data, style);
      setFormattedText(res);
      setLoading(false);
  };

  return (
    <div className={`border rounded-lg mb-4 transition-all duration-200 ${expanded ? 'shadow-md ring-1 ring-slate-200' : 'hover:border-slate-300'}`}>
      <div 
        className={`p-5 flex items-start gap-4 cursor-pointer ${getStatusColor(citation.status)} bg-opacity-40 rounded-t-lg ${!expanded && 'rounded-b-lg'}`}
        onClick={() => setExpanded(!expanded)}
      >
          <div className="mt-1 flex-shrink-0">
              {getStatusIcon(citation.status)}
          </div>
          <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1">
                 <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${
                     citation.status === VerificationStatus.HALLUCINATED ? 'bg-rose-100 border-rose-200 text-rose-800' : 
                     citation.status === VerificationStatus.VERIFIED ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 
                     'bg-amber-100 border-amber-200 text-amber-800'
                 }`}>
                     {getStatusLabel(citation.status)}
                 </span>
              </div>
              <h4 className="font-semibold text-base leading-tight text-slate-900 truncate pr-4">
                  {citation.extractedTitle || "Unknown Title"}
              </h4>
              <p className="text-sm text-slate-500 mt-1 truncate font-mono opacity-80">
                  {citation.originalText}
              </p>
              
              {/* Badge for Source */}
              {citation.status === VerificationStatus.VERIFIED && (
                  <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white border border-emerald-200 text-emerald-700 shadow-sm">
                          {citation.databaseMatch?.source === 'Google Search' ? <Globe className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                          {citation.databaseMatch?.source || 'Verified'}
                      </span>
                      <span className="text-xs font-medium text-emerald-700">
                          {citation.confidenceScore}% Match
                      </span>
                  </div>
              )}
          </div>
          <div className="flex-shrink-0 text-slate-400">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
      </div>

      {expanded && (
          <div className="p-5 border-t border-slate-100 bg-white rounded-b-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Verification Intelligence</h5>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-sm text-slate-700 leading-relaxed">
                          {citation.analysisNotes}
                      </div>
                      
                      {citation.databaseMatch?.url && (
                          <a 
                            href={citation.databaseMatch.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                          >
                              View Source Document <ExternalLink className="w-3 h-3" />
                          </a>
                      )}
                  </div>

                  {citation.status === VerificationStatus.VERIFIED && (
                      <div className="flex flex-col h-full">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">One-Click Cite</h5>
                          <div className="flex flex-wrap gap-2 mb-3">
                              {['APA 7', 'MLA 9', 'Chicago', 'Harvard'].map(s => (
                                  <button 
                                    key={s} 
                                    onClick={(e) => { e.stopPropagation(); handleFormat(s); }} 
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm"
                                  >
                                      {s}
                                  </button>
                              ))}
                          </div>
                          
                          <div className="flex-grow relative">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2 py-4 bg-slate-50 rounded border border-dashed border-slate-200">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Generating format...
                                </div>
                            ) : formattedText ? (
                                <div 
                                    className="p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700 break-words cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group h-full relative" 
                                    onClick={() => navigator.clipboard.writeText(formattedText)}
                                    title="Click to copy to clipboard"
                                >
                                    {formattedText}
                                    <div className="absolute top-2 right-2 p-1 bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Copy className="w-3 h-3 text-blue-500" />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded border border-dashed border-slate-200 py-4">
                                    Select a style above to generate citation
                                </div>
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
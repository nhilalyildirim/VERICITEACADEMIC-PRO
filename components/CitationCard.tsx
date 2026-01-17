import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Loader2, Copy, Check } from 'lucide-react';
import { Citation, VerificationStatus, CitationStyle } from '../types';
import { reformatCitation } from '../services/geminiService';

interface CitationCardProps {
  citation: Citation;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  const [expanded, setExpanded] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<string | null>(null);
  const [formattedText, setFormattedText] = useState<string>("");
  const [formatting, setFormatting] = useState(false);
  const [copied, setCopied] = useState(false);

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED: return 'border-emerald-200 bg-emerald-50/30';
      case VerificationStatus.HALLUCINATED: return 'border-rose-200 bg-rose-50/30';
      case VerificationStatus.AMBIGUOUS: return 'border-amber-200 bg-amber-50/30';
      default: return 'border-slate-200';
    }
  };

  const getIcon = (status: VerificationStatus) => {
     switch (status) {
      case VerificationStatus.VERIFIED: return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case VerificationStatus.HALLUCINATED: return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      default: return <AlertCircle className="w-5 h-5 text-amber-600" />;
    }
  };

  const handleFormat = async (style: string) => {
      setFormatting(true);
      setCurrentStyle(style);
      // If verified, use the real DB data, otherwise use extracted
      const dataToFormat = citation.databaseMatch?.source !== 'None' ? citation.databaseMatch : { title: citation.extractedTitle, author: citation.extractedAuthor };
      const res = await reformatCitation(dataToFormat, style);
      setFormattedText(res);
      setFormatting(false);
      setCopied(false);
  };

  const handleCopy = () => {
      if (!formattedText) return;
      navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border p-5 mb-4 transition-all duration-200 ${getStatusColor(citation.status)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
            <div className="mt-1 flex-shrink-0">
                {getIcon(citation.status)}
            </div>
            <div>
                <h4 className="text-slate-900 font-medium text-lg leading-snug">
                    {citation.extractedTitle || "Unknown Title"}
                </h4>
                <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                   {citation.originalText}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        citation.status === VerificationStatus.VERIFIED ? 'bg-emerald-100 text-emerald-700' : 
                        citation.status === VerificationStatus.HALLUCINATED ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {citation.status}
                    </span>
                    <span className="text-xs text-slate-400">Confidence: {citation.confidenceScore}%</span>
                </div>
            </div>
        </div>
        
        <button 
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-indigo-600 transition-colors"
        >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 pl-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Analysis Findings</h5>
                    <p className="text-sm text-slate-700 mb-3">{citation.analysisNotes}</p>
                    
                    {citation.databaseMatch?.url && citation.status === VerificationStatus.VERIFIED && (
                        <a 
                            href={citation.databaseMatch.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium text-sm transition-colors"
                        >
                            Open Source <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>

                {citation.status === VerificationStatus.VERIFIED && (
                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Citation Generator</h5>
                        <div className="flex gap-2 mb-3">
                            {Object.values(CitationStyle).map(style => (
                                <button
                                    key={style}
                                    onClick={() => handleFormat(style)}
                                    disabled={formatting}
                                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                                        currentStyle === style 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    } ${formatting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                        {formatting ? (
                            <div className="flex items-center gap-2 text-xs text-indigo-600 animate-pulse bg-indigo-50 p-2 rounded">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Generating {currentStyle} format...</span>
                            </div>
                        ) : formattedText ? (
                            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded border border-slate-200 group">
                                <div className="text-sm text-slate-800 font-mono break-all select-all">
                                    {formattedText}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all focus:outline-none"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic">Select a style to format</div>
                        )}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
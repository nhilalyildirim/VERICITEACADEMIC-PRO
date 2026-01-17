import React, { useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
  canUpload: boolean;
  onUpgradeReq: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing, canUpload, onUpgradeReq }) => {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) {
        onUpgradeReq();
        return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // Support for .txt and .md text files
    if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const content = event.target.result as string;
                setText(content);
                setFileName(file.name);
                
                // Simultaneous Trigger: Immediately analyze the file content
                if (content.length >= 10) {
                    onAnalyze(content);
                }
            }
        };
        reader.readAsText(file);
    } else {
        alert("For this version, please upload .txt or .md files. For .pdf or .docx, please copy and paste the bibliography section.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Input Academic Text</h2>
        <p className="text-sm text-slate-500">Paste your bibliography, references, or full academic paper below for verification.</p>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here (e.g., 'Smith (2020) argues that...')"
          className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all font-mono text-sm leading-relaxed"
          disabled={isAnalyzing}
        />
        
        {fileName && (
            <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                <FileText className="w-3 h-3" />
                {fileName}
                <button onClick={() => { setFileName(null); setText(''); }} className="hover:text-indigo-900">
                    <X className="w-3 h-3" />
                </button>
            </div>
        )}
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative">
             <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept=".txt,.md"
                disabled={isAnalyzing}
             />
             <label 
                htmlFor="file-upload"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    canUpload 
                    ? 'text-slate-600 bg-slate-100 hover:bg-slate-200' 
                    : 'text-slate-400 bg-slate-50 cursor-not-allowed'
                }`}
                onClick={(e) => {
                    if (!canUpload) {
                        e.preventDefault();
                        onUpgradeReq();
                    }
                }}
             >
                <UploadCloud className="w-4 h-4" />
                {canUpload ? 'Upload File (Auto-Analyze)' : 'Upload File (Premium)'}
             </label>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs text-slate-400 hidden md:inline">
                {text.length} characters
            </span>
            <button
                onClick={() => onAnalyze(text)}
                disabled={isAnalyzing || text.length < 10}
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
                {isAnalyzing ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scanning & Verifying...
                    </>
                ) : (
                    'Verify Citations'
                )}
            </button>
        </div>
      </div>
    </div>
  );
};
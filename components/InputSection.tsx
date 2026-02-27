
import React, { useState } from 'react';
import { Upload, FileText, X, Search, Loader2 } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Fix for ESM import of pdfjs-dist
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Initialize PDF Worker
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface InputSectionProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessingFile(true);

    try {
        if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            setText(result.value);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
            }
            setText(fullText);
        } else if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setText(event.target.result as string);
                }
            };
            reader.readAsText(file);
        } else {
            alert("Unsupported file type. Please upload .txt, .md, .docx, or .pdf.");
            setFileName(null);
            setText('');
        }
    } catch (error) {
        console.error("File processing failed:", error);
        alert("Failed to read the file. It might be corrupted or password protected.");
        setFileName(null);
        setText('');
    } finally {
        setIsProcessingFile(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Scholarly Text Input</h2>
        <div className="relative mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isProcessingFile ? "Deciphering manuscript..." : "Paste your citations or paper content here to identify hallucinations..."}
            className="w-full h-64 p-5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed transition-all"
            disabled={isAnalyzing || isProcessingFile}
          />
          {fileName && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-gray-200">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {fileName}
                  <button onClick={() => { setFileName(null); setText(''); }} className="hover:text-red-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
              </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                 <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".txt,.md,.pdf,.docx"
                    disabled={isAnalyzing || isProcessingFile}
                 />
                 <label 
                    htmlFor="file-upload"
                    className={`flex items-center gap-2.5 text-sm font-bold py-2 px-4 rounded-lg transition-all ${(isAnalyzing || isProcessingFile) ? 'text-gray-400 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50 cursor-pointer'}`}
                 >
                    {isProcessingFile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    {isProcessingFile ? 'Analyzing File...' : 'Upload .pdf, .docx, .txt'}
                 </label>
            </div>

            <button
                onClick={() => onAnalyze(text)}
                disabled={isAnalyzing || isProcessingFile || text.trim().length < 10}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-600/10 active:scale-95"
            >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isAnalyzing ? 'Scanning Databases...' : 'Verify Academic Citations'}
            </button>
        </div>
    </div>
  );
};

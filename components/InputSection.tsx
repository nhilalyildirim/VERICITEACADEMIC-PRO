import React, { useState } from 'react';
import { Upload, FileText, X, Search, Loader2 } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Fix for ESM import of pdfjs-dist
// The module namespace import (* as pdfjsLib) might have the actual library in .default
// or be flattened depending on the bundler/CDN.
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Initialize PDF Worker
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface InputSectionProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
  canUpload: boolean;
  onUpgradeReq: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing, canUpload, onUpgradeReq }) => {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) { onUpgradeReq(); return; }
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessingFile(true);

    try {
        if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            // Mammoth usually has extractRawText on the default export or named.
            const result = await mammoth.extractRawText({ arrayBuffer });
            setText(result.value);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            
            // Use the resolved 'pdfjs' object which has getDocument
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
    <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Input Text</h2>
        <div className="relative mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isProcessingFile ? "Reading file..." : "Paste your citations or text here..."}
            className="w-full h-48 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y font-mono text-sm"
            disabled={isAnalyzing || isProcessingFile}
          />
          {fileName && (
              <div className="absolute top-2 right-2 bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-1 border">
                  <FileText className="w-3 h-3" />
                  {fileName}
                  <button onClick={() => { setFileName(null); setText(''); }}><X className="w-3 h-3 hover:text-red-500" /></button>
              </div>
          )}
        </div>

        <div className="flex justify-between items-center">
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
                    className={`flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 ${(!canUpload || isAnalyzing || isProcessingFile) ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={(e) => { if (!canUpload) { e.preventDefault(); onUpgradeReq(); } }}
                 >
                    {isProcessingFile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    {isProcessingFile ? 'Processing...' : (canUpload ? 'Upload .txt, .pdf, .docx' : 'Upload file (Premium)')}
                 </label>
            </div>

            <button
                onClick={() => onAnalyze(text)}
                disabled={isAnalyzing || isProcessingFile || text.length < 5}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
            >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isAnalyzing ? 'Analyzing...' : 'Verify Citations'}
            </button>
        </div>
    </div>
  );
};
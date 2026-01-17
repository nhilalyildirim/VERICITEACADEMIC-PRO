import React, { useState } from 'react';
import { AnalysisReport } from '../types';
import { CitationCard } from './CitationCard';
import { Download, Printer, ArrowLeft, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AnalysisReportProps {
  report: AnalysisReport;
  onReset: () => void;
}

export const AnalysisReportView: React.FC<AnalysisReportProps> = ({ report, onReset }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    setIsDownloading(true);
    try {
      // Small delay to ensure styles are ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`VeriCite_Report_${report.id}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Failed to generate PDF. You can try the Print -> Save as PDF option.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <button 
            onClick={onReset}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
            <ArrowLeft className="w-4 h-4" /> Back to Input
        </button>
        <div className="flex gap-2">
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
            >
                <Printer className="w-4 h-4" /> Print View
            </button>
            <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
                {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
        </div>
      </div>

      {/* This ID is used by html2canvas */}
      <div id="report-content" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Verification Report</h2>
                    <p className="text-slate-500 text-sm mt-1">Generated on {new Date(report.timestamp).toLocaleString()}</p>
                    <p className="text-slate-400 text-xs uppercase tracking-wider mt-4">Report ID: {report.id}</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold text-slate-900">{report.overallTrustScore}%</div>
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Trust Score</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-2xl font-bold text-slate-800">{report.totalCitations}</div>
                    <div className="text-xs text-slate-500 font-medium uppercase mt-1">Total Citations</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-700">{report.verifiedCount}</div>
                    <div className="text-xs text-emerald-600 font-medium uppercase mt-1">Verified Real</div>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="text-2xl font-bold text-rose-700">{report.hallucinatedCount}</div>
                    <div className="text-xs text-rose-600 font-medium uppercase mt-1">Suspected Fake</div>
                </div>
            </div>
        </div>

        <div className="p-6 md:p-8 bg-white min-h-[400px]">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                Detailed Analysis
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{report.citations.length} Items</span>
            </h3>
            
            {report.citations.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    No citations found in the provided text.
                </div>
            ) : (
                report.citations.map((citation, idx) => (
                    <CitationCard key={idx} citation={citation} />
                ))
            )}
        </div>
        
        {/* Footer for PDF only */}
        <div className="hidden print:block p-8 pt-0 text-center">
             <p className="text-xs text-slate-400">VeriCite Academic Report • www.vericiteacademic.com</p>
        </div>
      </div>
    </div>
  );
};
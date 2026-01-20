import React from 'react';
import { AnalysisReport } from '../types';
import { CitationCard } from './CitationCard';
import { Download, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AnalysisReportProps {
  report: AnalysisReport;
  onReset: () => void;
}

export const AnalysisReportView: React.FC<AnalysisReportProps> = ({ report, onReset }) => {
  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VeriCite_Report_${report.id}.pdf`);
    } catch (e) { alert("Download failed"); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 no-print">
        <button onClick={onReset} className="text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Input
        </button>
        <button onClick={handleDownloadPDF} className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 flex items-center gap-2">
            <Download className="w-4 h-4" /> Save PDF
        </button>
      </div>

      <div id="report-content" className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Analysis Report</h1>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Trust Score</div>
                    <div className={`text-3xl font-bold ${report.overallTrustScore > 80 ? 'text-green-600' : report.overallTrustScore > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {report.overallTrustScore}%
                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">ID: {report.id} | Date: {new Date(report.timestamp).toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div className="p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold">{report.totalCitations}</div>
                <div className="text-xs text-gray-500 uppercase">Total</div>
            </div>
            <div className="p-4 bg-green-50 rounded text-green-700">
                <div className="text-2xl font-bold">{report.verifiedCount}</div>
                <div className="text-xs uppercase">Verified</div>
            </div>
            <div className="p-4 bg-red-50 rounded text-red-700">
                <div className="text-2xl font-bold">{report.hallucinatedCount}</div>
                <div className="text-xs uppercase">Suspected</div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-4">Detailed Results</h3>
            {report.citations.map((c, i) => <CitationCard key={i} citation={c} />)}
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { User, AnalysisReport } from '../types';
import { ArrowRight, FileText } from 'lucide-react';

interface DashboardProps {
    user: User;
    history: AnalysisReport[];
    onNavigateHome: () => void;
    onViewReport: (report: AnalysisReport) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, onNavigateHome, onViewReport }) => {
    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <button onClick={onNavigateHome} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                    New Analysis
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Scans</h3>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{history.length}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Avg. Trust Score</h3>
                    <div className="text-3xl font-bold text-gray-900 mt-2">
                        {history.length > 0 ? Math.round(history.reduce((a,b) => a + b.overallTrustScore, 0) / history.length) : 0}%
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">History</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {history.map(rpt => (
                        <li key={rpt.id} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => onViewReport(rpt)}>
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-2 rounded text-blue-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Analysis {rpt.id}</p>
                                    <p className="text-sm text-gray-500">{new Date(rpt.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${rpt.overallTrustScore > 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {rpt.overallTrustScore}%
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                        </li>
                    ))}
                    {history.length === 0 && (
                        <li className="p-8 text-center text-gray-500">No scan history available.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};
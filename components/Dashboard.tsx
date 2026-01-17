import React from 'react';
import { User, AnalysisReport } from '../types';
import { BarChart3, FileText, CheckCircle, Shield, ArrowRight, Clock } from 'lucide-react';

interface DashboardProps {
    user: User;
    history: AnalysisReport[];
    onNavigateHome: () => void;
    onViewReport: (report: AnalysisReport) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, onNavigateHome, onViewReport }) => {
    
    // Calculate stats
    const totalAnalyses = history.length;
    const avgTrustScore = totalAnalyses > 0 
        ? Math.round(history.reduce((acc, curr) => acc + curr.overallTrustScore, 0) / totalAnalyses) 
        : 0;
    const totalVerified = history.reduce((acc, curr) => acc + curr.verifiedCount, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back. Here is your academic verification overview.</p>
                </div>
                <button 
                    onClick={onNavigateHome}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-all shadow-md shadow-indigo-200"
                >
                    <FileText className="w-4 h-4" />
                    New Analysis
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Analyses</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalAnalyses}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Avg. Trust Score</p>
                            <h3 className="text-2xl font-bold text-slate-900">{avgTrustScore}%</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Citations Verified</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalVerified}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Recent Analysis History</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{history.length} Reports</span>
                </div>
                
                {history.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No analyses performed in this session yet.</p>
                        <button onClick={onNavigateHome} className="text-indigo-600 font-medium text-sm mt-2 hover:underline">Start your first check</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Report ID</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Trust Score</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((rpt) => (
                                    <tr key={rpt.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{rpt.id}</td>
                                        <td className="px-6 py-4">{new Date(rpt.timestamp).toLocaleDateString()} {new Date(rpt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                rpt.overallTrustScore > 80 ? 'bg-emerald-100 text-emerald-800' :
                                                rpt.overallTrustScore > 50 ? 'bg-amber-100 text-amber-800' :
                                                'bg-rose-100 text-rose-800'
                                            }`}>
                                                {rpt.overallTrustScore > 80 ? 'High Integrity' : rpt.overallTrustScore > 50 ? 'Needs Review' : 'Critical Issues'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{rpt.overallTrustScore}%</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => onViewReport(rpt)}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                                            >
                                                View <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
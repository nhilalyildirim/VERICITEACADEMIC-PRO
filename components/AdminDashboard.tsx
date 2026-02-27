
import React, { useState, useEffect } from 'react';
import { Users, Activity, UploadCloud, DollarSign, LogOut, RefreshCw, ArrowLeft, BarChart3 } from 'lucide-react';
import { authService } from '../services/authService';
import { db } from '../services/database';

interface AdminDashboardProps {
    onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
    const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, totalAnalyses: 0, fileUploads: 0, revenue: 0 });
    const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [s, a] = await Promise.all([
                db.getDashboardStats(),
                db.getRecentAnalyses()
            ]);
            setStats(s);
            setRecentAnalyses(a);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Failed to refresh admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleLogout = () => {
        authService.logoutAdmin();
        onBack();
    };

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Analyses', value: stats.totalAnalyses.toLocaleString(), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Files Uploaded', value: stats.fileUploads.toLocaleString(), icon: UploadCloud, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Revenue (Est.)', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="max-w-7xl mx-auto py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-2 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to App
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm">System performance and user metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={refreshData} 
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Analyses Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" /> Recent System Activity
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Last update: {lastRefresh.toLocaleTimeString()}</span>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                             <tr>
                                 <th className="px-6 py-3 font-bold">Report ID</th>
                                 <th className="px-6 py-3 font-bold">User ID</th>
                                 <th className="px-6 py-3 font-bold">Citations</th>
                                 <th className="px-6 py-3 font-bold">Trust Score</th>
                                 <th className="px-6 py-3 font-bold">Timestamp</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {recentAnalyses.length === 0 ? (
                                 <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No activity recorded yet.</td></tr>
                             ) : (
                                 recentAnalyses.map((analysis: any) => (
                                     <tr key={analysis.id} className="hover:bg-slate-50/50 transition-colors">
                                         <td className="px-6 py-4 font-mono text-slate-600 text-xs">{analysis.id}</td>
                                         <td className="px-6 py-4 text-slate-900 font-medium">{analysis.userId.substring(0, 8)}...</td>
                                         <td className="px-6 py-4 text-slate-600">{analysis.citationCount}</td>
                                         <td className="px-6 py-4">
                                             <div className="flex items-center gap-2">
                                                 <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                     <div 
                                                        className={`h-full rounded-full ${analysis.trustScore > 80 ? 'bg-emerald-500' : analysis.trustScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${analysis.trustScore}%` }}
                                                     />
                                                 </div>
                                                 <span className={`font-bold ${analysis.trustScore > 80 ? 'text-emerald-600' : analysis.trustScore > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                     {analysis.trustScore}%
                                                 </span>
                                             </div>
                                         </td>
                                         <td className="px-6 py-4 text-slate-400 text-xs">{new Date(analysis.timestamp).toLocaleString()}</td>
                                     </tr>
                                 ))
                             )}
                         </tbody>
                     </table>
                 </div>
            </div>
        </div>
    );
};

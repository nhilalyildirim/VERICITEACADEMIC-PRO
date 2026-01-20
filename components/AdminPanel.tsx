import React, { useState, useEffect } from 'react';
import { Lock, Users, Activity, UploadCloud, DollarSign, LogOut, AlertTriangle, FileText, Server } from 'lucide-react';
import { authService } from '../services/authService';

/**
 * ADMIN CONTROLLER
 * Handles routing within the /admin namespace.
 */
export const AdminPanel: React.FC = () => {
    const [path, setPath] = useState(window.location.pathname);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        // Simple client-side router for admin section
        const handlePopState = () => setPath(window.location.pathname);
        window.addEventListener('popstate', handlePopState);

        // Access Control Logic
        const checkAccess = () => {
            const isAuth = authService.isAuthenticated();
            
            if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
                // Redirect root admin to login or dashboard
                const target = isAuth ? '/admin/dashboard' : '/admin/login';
                window.history.replaceState({}, '', target);
                setPath(target);
            } else if (window.location.pathname.startsWith('/admin/dashboard')) {
                // Protect Dashboard
                if (!isAuth) {
                    window.history.replaceState({}, '', '/admin/login');
                    setPath('/admin/login');
                }
            } else if (window.location.pathname === '/admin/login') {
                // Redirect to dashboard if already logged in
                if (isAuth) {
                    window.history.replaceState({}, '', '/admin/dashboard');
                    setPath('/admin/dashboard');
                }
            }
            setIsCheckingAuth(false);
        };

        checkAccess();

        return () => window.removeEventListener('popstate', handlePopState);
    }, [path]);

    if (isCheckingAuth) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading secure environment...</div>;
    }

    if (path === '/admin/login') {
        return <AdminLogin onLoginSuccess={() => setPath('/admin/dashboard')} />;
    }

    if (path === '/admin/dashboard') {
        return <AdminDashboard onLogout={() => setPath('/admin/login')} />;
    }

    return <div className="p-8 text-center">404 - Admin Route Not Found</div>;
};

// --- SUB-COMPONENTS ---

const AdminLogin: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await authService.login(username, password);
            if (success) {
                // Update URL without reload
                window.history.pushState({}, '', '/admin/dashboard');
                onLoginSuccess();
            } else {
                setError('Invalid credentials.');
            }
        } catch (err) {
            setError('Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-2xl overflow-hidden">
                <div className="bg-slate-800 p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-3">
                        <Lock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-wide">VERICITE ADMIN</h1>
                    <p className="text-slate-400 text-sm mt-1">Authorized Personnel Only</p>
                </div>
                <form onSubmit={handleLogin} className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 outline-none"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-2.5 rounded hover:bg-slate-800 font-bold transition-colors disabled:opacity-70"
                        >
                            {loading ? 'Authenticating...' : 'Secure Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const handleLogout = () => {
        authService.logout();
        window.history.pushState({}, '', '/admin/login');
        onLogout();
    };

    // MOCK DATA for Admin View
    const stats = [
        { label: 'Total Users', value: '1,243', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Analyses', value: '8,542', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Files Uploaded', value: '4,102', icon: UploadCloud, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Revenue (MTD)', value: '$12,450', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Admin Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-900 p-1.5 rounded">
                            <Lock className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-slate-900">VeriCite <span className="font-normal text-slate-500">Admin</span></span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-8">System Overview</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* User Stats */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">User Distribution</h3>
                            <Users className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="p-6">
                             <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600 font-medium">Free Tier</span>
                                        <span className="text-gray-900 font-bold">78%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className="bg-slate-400 h-2.5 rounded-full" style={{width: '78%'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600 font-medium">Pro Subscribers</span>
                                        <span className="text-emerald-500 font-bold">22%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{width: '22%'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Logs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">System Logs</h3>
                            <Server className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="divide-y divide-gray-100">
                             {[1,2,3].map(i => (
                                <div key={i} className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-900">System backup completed successfully.</p>
                                        <p className="text-xs text-gray-400">Today, 04:00 AM</p>
                                    </div>
                                </div>
                             ))}
                             <div className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50 bg-red-50/50">
                                <div className="mt-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-900 font-medium">API Rate Limit Warning (Gemini)</p>
                                    <p className="text-xs text-gray-400">Yesterday, 11:42 PM</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Recent Analyses Table */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Recent Analyses</h3>
                     </div>
                     <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 text-gray-500 uppercase">
                                 <tr>
                                     <th className="px-6 py-3 font-medium">ID</th>
                                     <th className="px-6 py-3 font-medium">User</th>
                                     <th className="px-6 py-3 font-medium">Citations</th>
                                     <th className="px-6 py-3 font-medium">Trust Score</th>
                                     <th className="px-6 py-3 font-medium">Time</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {[1,2,3,4,5].map(i => (
                                     <tr key={i} className="hover:bg-gray-50">
                                         <td className="px-6 py-3 font-mono text-gray-600">REQ-{1000+i}</td>
                                         <td className="px-6 py-3 text-gray-900">user_{i*234}</td>
                                         <td className="px-6 py-3 text-gray-600">{10 + i}</td>
                                         <td className="px-6 py-3">
                                             <span className={`px-2 py-0.5 rounded text-xs font-bold ${i % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                 {i % 2 === 0 ? '98%' : '72%'}
                                             </span>
                                         </td>
                                         <td className="px-6 py-3 text-gray-400">{i * 12} mins ago</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </div>
            </main>
        </div>
    );
};
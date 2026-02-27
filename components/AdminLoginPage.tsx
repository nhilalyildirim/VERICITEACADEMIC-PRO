
import React, { useState } from 'react';
import { Lock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';

interface AdminLoginPageProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBack }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await authService.loginAdmin(username, password);
            if (success) {
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
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-3">
                        <Lock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-wide uppercase">Admin Login</h1>
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
                                className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-2.5 rounded hover:bg-slate-800 font-bold transition-colors disabled:opacity-70"
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                        </button>
                        <button 
                            type="button"
                            onClick={onBack}
                            className="w-full flex items-center justify-center gap-2 text-slate-500 text-sm hover:text-slate-700 transition-colors mt-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

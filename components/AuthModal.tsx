import React, { useState, useEffect } from 'react';
import { Check, X, Mail, Loader2, ArrowRight } from 'lucide-react';
import { PRICING } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (mode: 'login' | 'register' | 'upgrade') => void;
  initialMode: 'login' | 'register' | 'upgrade';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, initialMode }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'upgrade'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Sync internal state if prop changes while open
  useEffect(() => {
    if (isOpen) setMode(initialMode);
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSimulatedAuth = (provider: string) => {
      setLoadingProvider(provider);
      setTimeout(() => {
          setLoadingProvider(null);
          onAuthSuccess(mode);
      }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
          setIsLoading(false);
          onAuthSuccess(mode);
      }, 1500);
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const MicrosoftIcon = () => (
     <svg className="w-5 h-5" viewBox="0 0 23 23">
        <path fill="#F3F3F3" d="M0 0h23v23H0z"/>
        <path fill="#F35325" d="M1 1h10v10H1z"/>
        <path fill="#81BC06" d="M12 1h10v10H12z"/>
        <path fill="#05A6F0" d="M1 12h10v10H1z"/>
        <path fill="#FFBA08" d="M12 12h10v10H12z"/>
    </svg>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 transition-all">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2">
             <h3 className="text-2xl font-bold text-slate-900">
                {mode === 'upgrade' ? 'Upgrade Plan' : mode === 'register' ? 'Create Account' : 'Welcome Back'}
             </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="px-6 pb-8">
            {mode === 'upgrade' ? (
                // UPGRADE CONTENT
                <>
                    <p className="text-slate-500 mb-6">Unlock file uploads, unlimited analyses, and deep PDF verification.</p>
                    <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-100">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-lg font-bold text-slate-900">Pro Monthly</span>
                            <span className="text-2xl font-bold text-indigo-600">{PRICING.CURRENCY}{PRICING.MONTHLY}</span>
                        </div>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unlimited Citation Checks</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> PDF & DOCX Upload Support</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Priority Support</li>
                        </ul>
                    </div>
                    <button 
                        onClick={() => handleSimulatedAuth('upgrade')}
                        disabled={!!loadingProvider}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
                    >
                        {loadingProvider === 'upgrade' ? <Loader2 className="animate-spin w-5 h-5" /> : 'Subscribe Now'}
                    </button>
                </>
            ) : (
                // LOGIN / REGISTER CONTENT
                <>
                    <p className="text-slate-500 mb-6">
                        {mode === 'register' 
                            ? "Join thousands of academics verifying their research." 
                            : "Sign in to access your analysis history and dashboard."}
                    </p>
                    
                    {/* Social Login Buttons */}
                    <div className="space-y-3 mb-6">
                        <button 
                            onClick={() => handleSimulatedAuth('google')}
                            disabled={!!loadingProvider}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-slate-700 bg-white"
                        >
                            {loadingProvider === 'google' ? <Loader2 className="animate-spin w-5 h-5" /> : <GoogleIcon />}
                            Continue with Google
                        </button>
                        <button 
                            onClick={() => handleSimulatedAuth('microsoft')}
                            disabled={!!loadingProvider}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-slate-700 bg-white"
                        >
                            {loadingProvider === 'microsoft' ? <Loader2 className="animate-spin w-5 h-5" /> : <MicrosoftIcon />}
                            Continue with Microsoft
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400">Or continue with email</span>
                        </div>
                    </div>
                     
                    {/* Email Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {mode === 'register' && (
                             <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="John Doe" />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input required type="email" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="academic@university.edu" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input required type="password" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={isLoading || !!loadingProvider}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (mode === 'register' ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-6 text-center text-sm">
                        {mode === 'register' ? (
                            <p className="text-slate-500">
                                Already have an account?{' '}
                                <button onClick={() => setMode('login')} className="text-indigo-600 font-semibold hover:underline">
                                    Sign in
                                </button>
                            </p>
                        ) : (
                            <p className="text-slate-500">
                                Don't have an account?{' '}
                                <button onClick={() => setMode('register')} className="text-indigo-600 font-semibold hover:underline">
                                    Sign up for free
                                </button>
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
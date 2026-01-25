import React, { useState } from 'react';
import { X, Mail, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (mode: 'login' | 'register' | 'upgrade', rememberMe: boolean) => void;
  initialMode: 'login' | 'register' | 'upgrade';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Sync mode with prop
  React.useEffect(() => {
      setMode(initialMode);
      setError('');
  }, [initialMode, isOpen]);

  const handleOAuth = (provider: string) => {
      setError('');
      const providers = authService.getProviders();
      const config = providers[provider];
      
      // If client ID is missing in environment, show error but KEEP the button
      if (!config?.clientId) {
          setError(`${provider} sign-in is temporarily unavailable. Our administrators have been notified.`);
          return;
      }
      
      authService.initiateOAuth(provider);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      
      try {
          let result;
          if (mode === 'register') {
              result = await authService.registerUser(email, password);
          } else {
              result = await authService.loginUser(email, password, rememberMe);
          }

          if (result.success) {
              onAuthSuccess(mode, rememberMe);
          } else {
              setError(result.error || "Authentication failed.");
          }
      } catch (e) {
          setError("An unexpected error occurred. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-0 overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">
                {mode === 'upgrade' ? 'Upgrade to Pro' : mode === 'register' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6">
            {mode === 'upgrade' && (
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                    <p className="text-blue-900 font-medium mb-1">Unlock Full Access</p>
                    <p className="text-sm text-blue-700">Sign in or create an account to start your subscription.</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* OAuth Buttons - RESTORED & ALWAYS VISIBLE */}
            <div className="space-y-3 mb-6">
                <button 
                    onClick={() => handleOAuth('GOOGLE')}
                    className="w-full border border-gray-300 bg-white text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>
                
                <button 
                    onClick={() => handleOAuth('MICROSOFT')}
                    className="w-full border border-gray-300 bg-white text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
                >
                     <svg className="w-5 h-5" viewBox="0 0 23 23">
                        <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                        <path fill="#f35325" d="M1 1h10v10H1z"/>
                        <path fill="#81bc06" d="M12 1h10v10H12z"/>
                        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                        <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                    Continue with Microsoft
                </button>

                <button 
                    onClick={() => handleOAuth('ORCID')}
                    className="w-full border border-gray-300 bg-white text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
                >
                    <svg className="w-5 h-5 text-[#A6CE39]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.422.947.947s-.422.947-.947.947a.948.948 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.306v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z"/>
                    </svg>
                    Continue with ORCID
                </button>

                <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-semibold">Or using email</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            placeholder="name@university.edu"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        placeholder="••••••••"
                        minLength={6}
                    />
                </div>

                <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                    </label>
                    {mode === 'login' && (
                        <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Forgot password?
                        </button>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {mode === 'register' ? 'Create Account' : (mode === 'upgrade' ? 'Sign In & Subscribe' : 'Sign In')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
                    <button 
                        onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                        className="ml-1 text-blue-600 font-semibold hover:underline focus:outline-none"
                    >
                        {mode === 'register' ? 'Log in' : 'Sign up'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
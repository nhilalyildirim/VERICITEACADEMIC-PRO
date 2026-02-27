
import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  initialMode: 'login' | 'register' | 'upgrade';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, onAuthSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setSuccessMessage('');

      try {
          if (mode === 'register') {
              if (password.length < 6) {
                  throw new Error("Password must be at least 6 characters.");
              }
              if (password !== confirmPassword) {
                  throw new Error("Passwords do not match.");
              }
              const { needsConfirmation } = await authService.signUpWithEmail(email, password);
              if (needsConfirmation) {
                  setSuccessMessage("Check your email to confirm your account before logging in.");
                  setLoading(false);
                  return;
              }
          } else {
              await authService.signInWithEmail(email, password);
          }
          onAuthSuccess();
      } catch (e: any) {
          setError(e.message || "Authentication failed.");
          setLoading(false);
      }
  };

  const handleGoogleAuth = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      try {
          await authService.signInWithGoogle();
          // No direct success callback here as it redirects
      } catch (e: any) {
          setError(e.message || "Failed to initialize Google login.");
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-0 overflow-hidden relative">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">
                {mode === 'upgrade' ? 'Upgrade to Pro' : mode === 'register' ? 'Join VeriCite' : 'Researcher Log In'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-8">
            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2 text-sm text-emerald-700">
                    <AlertCircle className="w-4 h-4" />
                    {successMessage}
                </div>
            )}

            {mode !== 'upgrade' ? (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="researcher@university.edu"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                            <input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    )}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'register' ? 'Create Account' : 'Sign In')}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400 font-medium">or</span>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        className="w-full border border-slate-300 bg-white text-slate-900 py-3 rounded-xl hover:bg-slate-50 font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        Continue with Google
                    </button>
                </form>
            ) : (
                <div className="space-y-4">
                    <button 
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        className="w-full border border-slate-300 bg-white text-slate-900 py-3 rounded-xl hover:bg-slate-50 font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        Continue with Google
                    </button>
                </div>
            )}

            <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    By continuing, you agree to VeriCite's Academic Integrity Guidelines and Privacy Policy.
                </p>
                <div className="mt-4">
                    <button 
                        onClick={() => {
                            setMode(mode === 'register' ? 'login' : 'register');
                            setError('');
                            setSuccessMessage('');
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline"
                    >
                        {mode === 'register' ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

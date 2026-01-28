
import React, { useState } from 'react';
import { X, Mail, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (mode: 'login' | 'register' | 'upgrade', rememberMe: boolean) => void;
  initialMode: 'login' | 'register' | 'upgrade';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
      setLoading(true);
      setError('');
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
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    )}
                    Continue with Google
                </button>
            </div>

            <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    By continuing, you agree to VeriCite's Academic Integrity Guidelines and Privacy Policy.
                </p>
                <div className="mt-4">
                    <button 
                        onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                        className="text-xs text-blue-600 font-bold hover:underline"
                    >
                        {mode === 'register' ? 'Back to Login' : 'Create Researcher Account'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

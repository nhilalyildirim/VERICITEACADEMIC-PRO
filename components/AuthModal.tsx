import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (mode: 'login' | 'register' | 'upgrade', rememberMe: boolean) => void;
  initialMode: 'login' | 'register' | 'upgrade';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Reset mode when initialMode changes
  React.useEffect(() => {
      setMode(initialMode);
  }, [initialMode]);

  const handleGoogleLogin = async () => {
      // Abstracted Google OAuth Logic
      setLoading(true);
      console.log("Initiating Google OAuth flow...");
      setTimeout(() => {
          setLoading(false);
          alert("Google Sign-In will be available once backend OAuth keys are configured.");
      }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">
            {mode === 'upgrade' ? 'Upgrade Plan' : mode === 'register' ? 'Create Account' : 'Login'}
        </h2>

        {mode === 'upgrade' ? (
            <div className="text-center">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <span className="text-2xl font-bold">$14.99</span>/mo
                </div>
                <p className="text-gray-600 mb-6 text-sm">Unlock unlimited verifications, file uploads, and priority support.</p>
                <button onClick={() => onAuthSuccess('upgrade', false)} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-bold">
                    View Pricing & Subscribe
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                {/* Social Login Section */}
                <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full border border-gray-300 bg-white text-gray-700 py-2.5 rounded-md hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or with email</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <input type="email" placeholder="Email" className="w-full p-2 border rounded-md" />
                <input type="password" placeholder="Password" className="w-full p-2 border rounded-md" />
                
                {mode === 'login' && (
                  <div className="flex items-center">
                    <input 
                      id="remember_me" 
                      type="checkbox" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>
                )}

                <button onClick={() => onAuthSuccess(mode, rememberMe)} className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 font-medium">
                    {mode === 'register' ? 'Sign Up' : 'Sign In'}
                </button>
                <p className="text-center text-sm text-gray-600 cursor-pointer hover:underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                    {mode === 'login' ? 'Create an account' : 'Already have an account?'}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
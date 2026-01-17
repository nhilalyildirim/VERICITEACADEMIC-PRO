import React from 'react';
import { Check, X } from 'lucide-react';
import { PRICING } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  mode: 'login' | 'upgrade';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, mode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex justify-end p-4">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="px-8 pb-8 text-center">
            {mode === 'upgrade' ? (
                <>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                        <Check className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Upgrade to Pro</h3>
                    <p className="text-slate-500 mb-6">Unlock file uploads, unlimited analyses, and deep PDF verification.</p>
                    
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-lg font-bold text-slate-900">Monthly</span>
                            <span className="text-2xl font-bold text-indigo-600">{PRICING.CURRENCY}{PRICING.MONTHLY}</span>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unlimited Citation Checks</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> PDF & DOCX Upload Support</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Priority Support</li>
                        </ul>
                    </div>
                    
                    <button 
                        onClick={onLogin}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200"
                    >
                        Subscribe Now
                    </button>
                </>
            ) : (
                <>
                     <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h3>
                     <p className="text-slate-500 mb-6">Sign in to access your analysis history.</p>
                     
                     <form className="space-y-4 text-left" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="academic@university.edu" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input type="password" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••" />
                        </div>
                        <button 
                            type="submit"
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
                        >
                            Sign In
                        </button>
                     </form>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
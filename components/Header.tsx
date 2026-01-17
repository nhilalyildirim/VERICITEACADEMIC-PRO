import React from 'react';
import { ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
    user: User | null;
    currentView: string;
    onLogin: () => void;
    onLogout: () => void;
    onNavigate: (view: 'home' | 'dashboard') => void;
}

export const Header: React.FC<HeaderProps> = ({ user, currentView, onLogin, onLogout, onNavigate }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('home')}
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              VeriCite <span className="text-indigo-600">Academic</span>
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
             <button onClick={() => onNavigate('home')} className={`font-medium transition-colors ${currentView === 'home' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Verify</button>
             {user && (
                 <button onClick={() => onNavigate('dashboard')} className={`font-medium transition-colors ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Dashboard</button>
             )}
             <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
             {user ? (
                 <div className="flex items-center gap-4">
                     <div className="hidden md:flex items-center gap-2">
                         <span className="text-sm text-slate-600">
                             {user.isPremium ? 'Pro Plan' : 'Free Plan'}
                         </span>
                         <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold border border-indigo-200">
                             U
                         </div>
                     </div>
                     <button 
                        onClick={onLogout}
                        className="text-slate-400 hover:text-slate-600"
                        title="Sign Out"
                     >
                         <LogOut className="w-5 h-5" />
                     </button>
                 </div>
             ) : (
                <button 
                    onClick={onLogin}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all"
                >
                    <LogIn className="w-4 h-4" />
                    Sign In
                </button>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};
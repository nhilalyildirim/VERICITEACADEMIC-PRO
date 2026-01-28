
import React from 'react';
import { BookOpenCheck, LogOut, LayoutDashboard, ShieldCheck, Zap, CreditCard, Gem } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
    user: UserType | null;
    currentView: string;
    onLogin: () => void;
    onRegister: () => void;
    onLogout: () => void;
    onNavigate: (view: any) => void;
    analysisCount: number;
}

export const Header: React.FC<HeaderProps> = ({ user, currentView, onLogin, onRegister, onLogout, onNavigate }) => {
  const credits = user?.credits ?? 5;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
                <BookOpenCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              VeriCite <span className="text-blue-500 font-light">Academic</span>
            </span>
          </div>
          
          <nav className="hidden md:flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
             <button 
                onClick={() => onNavigate('home')} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'home' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                <ShieldCheck className="w-4 h-4" /> Verify
             </button>
             {user && (
                 <button 
                    onClick={() => onNavigate('dashboard')} 
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'dashboard' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                 >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                 </button>
             )}
             <button 
                onClick={() => onNavigate('pricing')} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'pricing' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                <Gem className="w-4 h-4" /> Pricing
             </button>
          </nav>

          <div className="flex items-center gap-4">
             {/* Persistent Credit Counter */}
             {user && !user.isPremium && (
                 <div className="hidden md:flex items-center px-3 py-1 rounded bg-slate-800 border border-slate-700">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2">Remaining</span>
                     <span className="text-sm font-bold text-white">{credits} Scans</span>
                 </div>
             )}

             {user ? (
                 <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                     <div 
                        className="text-right hidden sm:block cursor-pointer hover:opacity-80 transition-opacity mr-2"
                        title="Plan Status"
                     >
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Tier</div>
                        <div className="text-xs font-bold text-white flex items-center gap-1">
                            {user.isPremium ? <span className="text-amber-400 flex items-center gap-1"><Zap className="w-3 h-3 fill-current" /> Pro</span> : 'Free'}
                        </div>
                     </div>
                     
                     <button 
                        onClick={() => onNavigate('billing')}
                        className={`p-2 rounded-full transition-colors ${currentView === 'billing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Billing"
                     >
                         <CreditCard className="w-5 h-5" />
                     </button>
                     
                     <button 
                        onClick={onLogout}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                        title="Sign Out"
                     >
                         <LogOut className="w-5 h-5" />
                     </button>
                 </div>
             ) : (
                <div className="flex items-center gap-3 text-sm">
                    <button 
                        onClick={onLogin}
                        className="text-slate-300 hover:text-white font-bold transition-colors"
                    >
                        Log In
                    </button>
                    <button 
                        onClick={onRegister}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        Get Started
                    </button>
                </div>
             )}
          </div>
      </div>
    </header>
  );
};

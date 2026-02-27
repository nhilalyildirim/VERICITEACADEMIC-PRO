
import React from 'react';
import { BookOpenCheck, LogOut, LayoutDashboard, ShieldCheck, Gem, BarChart3 } from 'lucide-react';
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

export const Header: React.FC<HeaderProps> = ({ user, currentView, onLogin, onRegister, onLogout, onNavigate, analysisCount }) => {
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
                <Gem className="w-4 h-4" /> Free & Open
             </button>
          </nav>

          <div className="flex items-center gap-4">
             {user ? (
                 <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                     {/* Use analysisCount here to fix TS error and provide user value */}
                     <div className="hidden lg:flex flex-col items-end mr-3">
                        <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                           <BarChart3 className="w-2.5 h-2.5" /> Total Scans
                        </div>
                        <div className="text-xs font-bold text-white">{analysisCount}</div>
                     </div>
                     
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


import React from 'react';
import { BookOpenCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-gray-100 py-16 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <BookOpenCheck className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">VeriCite Academic</span>
            </div>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              The professional anti-hallucination engine for scholarly integrity. Verifying citations across global indices in real-time to protect your research credibility.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Platform</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600 transition-colors">Verify Text</button></li>
              <li><button onClick={() => onNavigate('pricing')} className="hover:text-blue-600 transition-colors">Pricing & Plans</button></li>
              <li><button onClick={() => onNavigate('support')} className="hover:text-blue-600 transition-colors">Support Center</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Legal & Ethics</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><button onClick={() => onNavigate('terms')} className="hover:text-blue-600 transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onNavigate('privacy')} className="hover:text-blue-600 transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate('integrity')} className="hover:text-blue-600 transition-colors">Academic Integrity</button></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            © 2026 VeriCite Academic | High-Performance Scan Engine
          </div>
          <div className="flex gap-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Enterprise Grade</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div> Scholarly Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

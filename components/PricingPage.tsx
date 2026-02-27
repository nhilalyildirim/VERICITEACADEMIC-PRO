import React from 'react';
import { Gift, Check, ArrowLeft } from 'lucide-react';

interface PricingPageProps {
  onBack: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6 text-blue-600">
          <Gift className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          VeriCite Academic is Free — <span className="text-blue-600">Our Gift to Academia</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We believe academic integrity should be accessible to every student and researcher, everywhere. No credit card. No limits. No catch.
        </p>
      </div>

      <div className="max-w-md mx-auto mb-16">
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-10 flex flex-col relative overflow-hidden text-white border border-slate-800">
          <div className="absolute top-0 right-0 bg-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-bl-xl tracking-widest uppercase">
            FREE FOREVER
          </div>
          
          <h3 className="text-2xl font-bold mb-2">Academic Access</h3>
          <div className="mt-4 mb-8 flex items-baseline gap-1">
            <span className="text-6xl font-black tracking-tighter">$0</span>
            <span className="text-slate-400 font-medium">/forever</span>
          </div>

          <ul className="space-y-5 mb-10 flex-grow">
            {[
              "Unlimited citation verifications",
              "AI-powered hallucination detection",
              "PDF & Word document upload",
              "Crossref & OpenAlex database access",
              "Real-time Google Scholar grounding",
              "Full analysis reports",
              "Dashboard & history"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-4 text-slate-200">
                <div className="bg-emerald-500/20 rounded-full p-1">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-medium">{feature}</span>
              </li>
            ))}
          </ul>
          
          <button 
            onClick={onBack}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
          >
            Start Verifying — It's Free
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Why Free?</h3>
        <p className="text-slate-600 leading-relaxed">
          VeriCite Academic was built by a researcher who experienced firsthand how damaging AI hallucinations can be in academic work. We're committed to keeping this tool free as long as we can. If you find it valuable, share it with your department.
        </p>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { AnalysisReportView } from './components/AnalysisReport';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { SupportPage } from './components/SupportPage';
import { PricingPage } from './components/PricingPage';
import { BillingPage } from './components/BillingPage';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfService } from './components/legal/TermsOfService';
import { AcademicIntegrity } from './components/legal/AcademicIntegrity';
import { extractCitationsFromText } from './services/geminiService';
import { verifyCitationParallel } from './services/academicService';
import { authService } from './services/authService';
import { db } from './services/database'; 
import { User, AnalysisReport, VerificationStatus } from './types';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'upgrade'>('login');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard' | 'report' | 'support' | 'pricing' | 'billing' | 'privacy' | 'terms' | 'integrity'>('home');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const isConfigMissing = !db.isReady();

  useEffect(() => {
    if (db.isReady()) {
        authService.handleAuthRedirect().then(profile => {
            if (profile) setUser(profile);
        });
    }
  }, []);

  const handleAnalysis = async (text: string) => {
    if (!db.isReady() || !user) {
        setAuthMode('login');
        setIsAuthModalOpen(true);
        return;
    }

    setIsAnalyzing(true);
    try {
      // 1. ATOMIC CREDIT DEDUCTION (Source of Truth)
      const success = await db.deductCredit(user.id);
      if (!success) {
          alert("No credits remaining. Upgrade to Pro for unlimited scans.");
          setView('pricing');
          setIsAnalyzing(false);
          return;
      }

      // 2. High-Speed Citation Extraction
      const citations = await extractCitationsFromText(text);
      if (citations.length === 0) {
          alert("No academic citations detected.");
          setIsAnalyzing(false);
          return;
      }

      // 3. Optimized Parallel Verification (Batching to prevent 429)
      const results = [];
      const BATCH_SIZE = 12; // Massive parallelization for speed
      for (let i = 0; i < citations.length; i += BATCH_SIZE) {
          const batch = citations.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(batch.map(c => verifyCitationParallel(c)));
          results.push(...batchResults);
          if (i + BATCH_SIZE < citations.length) await new Promise(r => setTimeout(r, 150));
      }

      const verifiedCount = results.filter(r => r.status === VerificationStatus.VERIFIED).length;
      const score = Math.round((verifiedCount / results.length) * 100);

      const report: AnalysisReport = {
        id: `VC-${Date.now().toString().slice(-6)}`,
        timestamp: Date.now(),
        totalCitations: results.length,
        verifiedCount,
        hallucinatedCount: results.length - verifiedCount,
        overallTrustScore: score,
        citations: results
      };

      // 4. Persistence
      await db.recordAnalysis(report, user.id);
      const updatedProfile = await db.getUserProfile(user.id);
      if (updatedProfile) setUser(updatedProfile);

      setCurrentReport(report);
      setHistory(prev => [report, ...prev]);
      setView('report');

    } catch (e: any) {
       alert("Scanning engine error. Check your internet or Gemini key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Header user={user} currentView={view} onLogin={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} onRegister={() => { setAuthMode('register'); setIsAuthModalOpen(true); }} onLogout={async () => { await authService.logoutUser(); setUser(null); setView('home'); }} onNavigate={setView} analysisCount={user?.analysisCount || 0} />
      <main className="container mx-auto px-4 flex-grow">
          {view === 'pricing' && <PricingPage user={user} onBack={() => setView('home')} onSubscribeSuccess={() => setView('billing')} onAuthReq={() => { setAuthMode('register'); setIsAuthModalOpen(true); }} />}
          {view === 'billing' && user && <BillingPage user={user} invoices={[]} onBack={() => setView('dashboard')} />}
          {view === 'support' && <SupportPage onBack={() => setView('home')} />}
          {view === 'dashboard' && user && <Dashboard user={user} history={history} onNavigateHome={() => setView('home')} onViewReport={(r) => { setCurrentReport(r); setView('report'); }} />}
          {view === 'report' && currentReport && <AnalysisReportView report={currentReport} onReset={() => setView('home')} />}
          {view === 'privacy' && <PrivacyPolicy onBack={() => setView('home')} />}
          {view === 'terms' && <TermsOfService onBack={() => setView('home')} />}
          {view === 'integrity' && <AcademicIntegrity onBack={() => setView('home')} />}
          {view === 'home' && (
            <div className="max-w-4xl mx-auto py-12">
                {isConfigMissing && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex gap-2"><AlertCircle /> Configuration Missing. Check Vercel Environment Variables.</div>}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-slate-900 mb-4">VeriCite <span className="text-blue-600 font-light">Academic</span></h1>
                    <p className="text-xl text-slate-600">The Scholarly Anti-Hallucination Engine.</p>
                </div>
                <InputSection onAnalyze={handleAnalysis} isAnalyzing={isAnalyzing} canUpload={!!user?.isPremium} onUpgradeReq={() => { setAuthMode('upgrade'); setIsAuthModalOpen(true); }} />
            </div>
          )}
      </main>
      <footer className="py-8 border-t border-gray-100 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">VeriCite Academic | High Speed Production</footer>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => setIsAuthModalOpen(false)} initialMode={authMode} />
    </div>
  );
};

export default App;

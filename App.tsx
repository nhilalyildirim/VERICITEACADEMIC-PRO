import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { AnalysisReportView } from './components/AnalysisReport';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { SupportPage } from './components/SupportPage';
import { PricingPage } from './components/PricingPage';
import { AdminPanel } from './components/AdminPanel';
import { BillingPage } from './components/BillingPage';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfService } from './components/legal/TermsOfService';
import { AcademicIntegrity } from './components/legal/AcademicIntegrity';
import { extractCitationsFromText } from './services/geminiService';
import { verifyCitationParallel } from './services/academicService';
import { authService } from './services/authService';
import { db } from './services/database'; 
import { User, AnalysisReport, VerificationStatus } from './types';
import { MAX_FREE_ANALYSIS } from './constants';

type ViewType = 'home' | 'dashboard' | 'report' | 'support' | 'pricing' | 'billing' | 'privacy' | 'terms' | 'integrity';

const App: React.FC = () => {
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname.startsWith('/admin'));
  
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentUserId, setCurrentUserId] = useState(() => user ? user.id : db.getOrCreateGuestId());
  const [analysisCount, setAnalysisCount] = useState<number>(() => db.getAnalysisCount(currentUserId));

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'upgrade'>('login');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<ViewType>('home');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);

  // Robust Identity Sync
  useEffect(() => {
      const activeId = user ? user.id : db.getOrCreateGuestId();
      setCurrentUserId(activeId);
      // Fetch fresh count from simulated DB to prevent client-side credit reset
      setAnalysisCount(db.getAnalysisCount(activeId));
  }, [user]);

  // OAuth Lifecycle
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (code && state) {
          window.history.replaceState({}, '', window.location.pathname);
          authService.handleOAuthCallback(code, state).then(res => {
              if (res.success && res.user) {
                  setUser(res.user);
              }
          });
      }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
        setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isAdminRoute) return <AdminPanel />;

  const handleLogout = () => {
      authService.logoutUser();
      setUser(null);
      setView('home');
  };

  const handleAnalysis = async (text: string) => {
    // PRE-FLIGHT: Force a fresh database check for credits
    const freshCount = db.getAnalysisCount(currentUserId);
    if (!user?.isPremium && freshCount >= MAX_FREE_ANALYSIS) {
      setAuthMode('upgrade');
      setIsAuthModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      // PHASE 1: Structured Extraction (Target: 2-4s)
      const extractedRaw = await extractCitationsFromText(text);
      if (extractedRaw.length === 0) {
          alert("No formal citations identified in the input.");
          setIsAnalyzing(false);
          return;
      }

      // PHASE 2: Parallel Batching (Target: 10-15s total)
      // Optimized batching strategy: Higher concurrency for initial metadata checks,
      // lower concurrency for expensive grounding fallbacks.
      const verifiedCitations = [];
      const batchSize = 2; // Conservative for rate limit safety, yet fast due to conditional skipping in Service
      
      for (let i = 0; i < extractedRaw.length; i += batchSize) {
          const batch = extractedRaw.slice(i, i + batchSize);
          const batchResults = await Promise.all(
              batch.map(item => verifyCitationParallel(item))
          );
          verifiedCitations.push(...batchResults);
          
          // Throttling delay only if more batches remain
          if (i + batchSize < extractedRaw.length) {
              await new Promise(r => setTimeout(r, 800));
          }
      }

      const verifiedCount = verifiedCitations.filter(c => c.status === VerificationStatus.VERIFIED).length;
      const hallucinatedCount = verifiedCitations.filter(c => c.status === VerificationStatus.HALLUCINATED).length;
      const score = Math.round((verifiedCount / verifiedCitations.length) * 100);

      const newReport: AnalysisReport = {
        id: `RPT-${Date.now().toString().slice(-6)}`,
        timestamp: Date.now(),
        totalCitations: verifiedCitations.length,
        verifiedCount,
        hallucinatedCount,
        overallTrustScore: score,
        citations: verifiedCitations
      };

      // PERSISTENCE: Atomic update in Simulated DB
      db.recordAnalysis(newReport, currentUserId);
      setAnalysisCount(db.getAnalysisCount(currentUserId));

      setCurrentReport(newReport);
      setHistory(prev => [newReport, ...prev]);
      setView('report');

    } catch (error: any) {
       console.error("[App] Analysis Failed:", error);
       alert(`Technical Error: ${error.message || 'Verification system is temporarily at capacity. Please try again in 10 seconds.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
      switch(view) {
          case 'pricing': return <PricingPage user={user} onBack={() => setView('home')} onSubscribeSuccess={() => { const u = db.getUser(user!.id); setUser(u as any); setView('billing'); }} onAuthReq={() => { setAuthMode('register'); setIsAuthModalOpen(true); }} />;
          case 'billing': return user ? <BillingPage user={user} invoices={db.getUserInvoices(user.id)} onBack={() => setView('dashboard')} /> : null;
          case 'support': return <SupportPage onBack={() => setView('home')} />;
          case 'dashboard': return user ? <Dashboard user={user} history={history} onNavigateHome={() => setView('home')} onViewReport={(r) => { setCurrentReport(r); setView('report'); }} /> : null;
          case 'report': return currentReport ? <AnalysisReportView report={currentReport} onReset={() => setView('home')} /> : null;
          case 'privacy': return <PrivacyPolicy onBack={() => setView('home')} />;
          case 'terms': return <TermsOfService onBack={() => setView('home')} />;
          case 'integrity': return <AcademicIntegrity onBack={() => setView('home')} />;
          case 'home':
          default:
              return (
                <div className="max-w-4xl mx-auto py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">VeriCite <span className="text-blue-600">Academic</span></h1>
                        <p className="text-xl text-slate-600 font-medium">Professional AI Hallucination Detector for Researchers.</p>
                    </div>
                    <InputSection onAnalyze={handleAnalysis} isAnalyzing={isAnalyzing} canUpload={!!user?.isPremium} onUpgradeReq={() => { setAuthMode('upgrade'); setIsAuthModalOpen(true); }} />
                </div>
              );
      }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Header user={user} currentView={view} onLogin={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} onRegister={() => { setAuthMode('register'); setIsAuthModalOpen(true); }} onLogout={handleLogout} onNavigate={setView} analysisCount={analysisCount} />
      
      <main className="container mx-auto px-4 flex-grow">
          {renderContent()}
      </main>

      <footer className="border-t border-gray-100 bg-gray-50 py-12 mt-auto">
          <div className="container mx-auto px-4 text-center">
              <div className="text-slate-500 text-sm mb-4">
                  © 2026 VeriCite Academic. All rights reserved. Professional verification for researchers.
              </div>
              <nav className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-600">
                  <button onClick={() => setView('privacy')} className="hover:text-blue-600 transition-colors">Privacy Policy</button>
                  <span className="text-slate-300 hidden sm:inline" aria-hidden="true">|</span>
                  <button onClick={() => setView('terms')} className="hover:text-blue-600 transition-colors">Terms of Service</button>
                  <span className="text-slate-300 hidden sm:inline" aria-hidden="true">|</span>
                  <button onClick={() => setView('integrity')} className="hover:text-blue-600 transition-colors">Academic Integrity</button>
                  <span className="text-slate-300 hidden sm:inline" aria-hidden="true">|</span>
                  <button onClick={() => setView('support')} className="hover:text-blue-600 transition-colors">Support Center</button>
              </nav>
          </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => { setUser(authService.getCurrentUser()); setIsAuthModalOpen(false); setView('dashboard'); }} initialMode={authMode} />
    </div>
  );
};

export default App;
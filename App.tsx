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
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { db } from './services/database'; 
import { User, AnalysisReport, VerificationStatus, Citation } from './types';
import { MAX_FREE_ANALYSIS } from './constants';

type ViewType = 'home' | 'dashboard' | 'report' | 'support' | 'pricing' | 'billing' | 'privacy' | 'terms' | 'integrity';

const App: React.FC = () => {
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname.startsWith('/admin'));
  
  // SESSION & USAGE
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentUserId] = useState(() => user ? user.id : db.getOrCreateGuestId());
  const [analysisCount, setAnalysisCount] = useState<number>(() => db.getAnalysisCount(currentUserId));

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'upgrade'>('login');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<ViewType>('home');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);

  // OAUTH CALLBACK
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (code && state) {
          window.history.replaceState({}, '', window.location.pathname);
          authService.handleOAuthCallback(code, state).then(res => {
              if (res.success && res.user) {
                  setUser(res.user);
                  setAnalysisCount(res.user.analysisCount);
                  setView('dashboard');
              }
          });
      }
  }, []);

  if (isAdminRoute) return <AdminPanel />;

  const handleLogout = () => {
      authService.logoutUser();
      setUser(null);
      setAnalysisCount(db.getAnalysisCount(db.getOrCreateGuestId()));
      setView('home');
  };

  const handleAnalysis = async (text: string) => {
    if (!user?.isPremium && analysisCount >= MAX_FREE_ANALYSIS) {
      setAuthMode('upgrade');
      setIsAuthModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Step 1: Rapid Extraction
      const extractedRaw = await extractCitationsFromText(text);
      if (extractedRaw.length === 0) {
          alert("No citations identified in the text.");
          setIsAnalyzing(false);
          return;
      }

      // Step 2: Parallel Verification (Massive performance gain)
      // Processes all citations concurrently while handling internal throttling
      const verifiedCitations = await Promise.all(
          extractedRaw.map(item => verifyCitationParallel(item))
      );

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

      // Persistence
      db.recordAnalysis(newReport, currentUserId);
      setAnalysisCount(prev => prev + 1);

      setCurrentReport(newReport);
      setHistory(prev => [newReport, ...prev]);
      setView('report');

    } catch (error: any) {
       console.error("Analysis Error:", error);
       alert(`Service Error: ${error.message || 'The AI model is currently overloaded. Please try again in a few seconds.'}`);
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
      <main className="container mx-auto px-4 flex-grow">{renderContent()}</main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={() => { setUser(authService.getCurrentUser()); setIsAuthModalOpen(false); setView('dashboard'); }} initialMode={authMode} />
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
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
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { extractCitationsFromText } from './services/geminiService';
import { verifyCitationParallel } from './services/academicService';
import { authService } from './services/authService';
import { db } from './services/database'; 
import { User, AnalysisReport, VerificationStatus } from './types';
import { CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'upgrade'>('login');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard' | 'report' | 'support' | 'pricing' | 'billing' | 'privacy' | 'terms' | 'integrity' | 'admin'>('home');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  
  const isCloudConnected = db.isReady();

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setView('admin');
    }
  }, []);

  useEffect(() => {
    if (isCloudConnected) {
        authService.handleAuthRedirect().then(profile => {
            if (profile) setUser(profile);
        });
    }
  }, [isCloudConnected]);

  const handleAnalysis = async (text: string) => {
    setIsAnalyzing(true);
    try {
        // AI extraction of citations
        const citations = await extractCitationsFromText(text);
        if (!citations || citations.length === 0) {
            alert("No citations were found in the provided text.");
            setIsAnalyzing(false);
            return;
        }

        // Parallel verification across academic indices
        const verifiedCitations = await Promise.all(
            citations.map(c => verifyCitationParallel(c))
        );

        const verifiedCount = verifiedCitations.filter(c => c.status === VerificationStatus.VERIFIED).length;
        const hallucinatedCount = verifiedCitations.filter(c => c.status === VerificationStatus.HALLUCINATED).length;
        
        const report: AnalysisReport = {
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            timestamp: Date.now(),
            totalCitations: verifiedCitations.length,
            verifiedCount,
            hallucinatedCount,
            overallTrustScore: Math.round((verifiedCount / verifiedCitations.length) * 100),
            citations: verifiedCitations
        };

        setCurrentReport(report);
        setHistory(prev => [report, ...prev]);
        setView('report');

        if (user) {
            await db.recordAnalysis(report, user.id);
            // Refresh profile to update analysis count
            const updatedProfile = await db.getUserProfile(user.id);
            if (updatedProfile) {
                setUser(updatedProfile);
                authService.saveUserSession(updatedProfile, true);
            }
        }
    } catch (error: any) {
        console.error("[App] Analysis failed:", error?.message, error);
        alert(`Verification engine error: ${error?.message || "Unknown error"}. Please try again.`);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        user={user} 
        currentView={view}
        analysisCount={history.length}
        onLogin={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
        onRegister={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
        onLogout={() => { authService.logoutUser(); setUser(null); setView('home'); }}
        onNavigate={(v) => setView(v)}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        {!isCloudConnected && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800 text-sm">
                <CloudOff className="w-5 h-5" />
                <span>Cloud disconnected: Running in local guest mode.</span>
            </div>
        )}

        {view === 'home' && (
          <div className="max-w-4xl mx-auto py-12 text-center">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Academic Integrity, <span className="text-blue-600">Verified.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
              The professional anti-hallucination engine. Paste your text or upload documents to identify fabricated citations.
            </p>
            <InputSection 
              onAnalyze={handleAnalysis} 
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {view === 'report' && currentReport && (
          <AnalysisReportView report={currentReport} onReset={() => setView('home')} />
        )}

        {view === 'dashboard' && user && (
          <Dashboard 
            user={user} 
            history={history} 
            onNavigateHome={() => setView('home')} 
            onViewReport={(r) => { setCurrentReport(r); setView('report'); }} 
          />
        )}

        {view === 'support' && <SupportPage onBack={() => setView('home')} />}
        
        {view === 'pricing' && (
          <PricingPage onBack={() => setView('home')} />
        )}

        {view === 'billing' && (
          <BillingPage onBack={() => setView('home')} />
        )}

        {view === 'privacy' && <PrivacyPolicy onBack={() => setView('home')} />}
        {view === 'terms' && <TermsOfService onBack={() => setView('home')} />}
        {view === 'integrity' && <AcademicIntegrity onBack={() => setView('home')} />}

        {view === 'admin' && !authService.isAdminAuthenticated() && (
          <AdminLoginPage onLoginSuccess={() => setView('admin')} onBack={() => { window.history.pushState({}, '', '/'); setView('home'); }} />
        )}
        {view === 'admin' && authService.isAdminAuthenticated() && (
          <AdminDashboard onBack={() => { window.history.pushState({}, '', '/'); setView('home'); }} />
        )}
      </main>

      <Footer onNavigate={setView} />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode}
        onAuthSuccess={async () => {
           const profile = authService.getCurrentUser();
           setUser(profile);
           setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
};

// Fixed: Added default export for index.tsx to consume
export default App;

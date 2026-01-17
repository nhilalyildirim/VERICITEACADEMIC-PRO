import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { AnalysisReportView } from './components/AnalysisReport';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { extractCitationsFromText } from './services/geminiService';
import { verifyCitationWithCrossref } from './services/academicService';
import { User, AnalysisReport, VerificationStatus } from './types';
import { MAX_FREE_ANALYSIS } from './constants';

const App: React.FC = () => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'upgrade'>('login');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Navigation & Data State
  const [view, setView] = useState<'home' | 'dashboard' | 'report'>('home');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [analysisCount, setAnalysisCount] = useState(0);

  // Handlers
  const handleLogin = () => {
    // Mock login logic
    const mockUser = { id: 'u123', isPremium: authMode === 'upgrade', analysisCount: 0 };
    setUser(mockUser);
    setIsAuthModalOpen(false);
    // Redirect to dashboard on login
    setView('dashboard');
  };

  const handleLogout = () => {
      setUser(null);
      setView('home');
      setHistory([]); // Clear session history on logout for privacy in this demo
  };

  const handleAnalysis = async (text: string) => {
    // Check Limits
    if (!user && analysisCount >= MAX_FREE_ANALYSIS) {
      setAuthMode('upgrade');
      setIsAuthModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setCurrentReport(null);

    try {
      // Step 1: Extract (Gemini)
      const extractedRaw = await extractCitationsFromText(text);
      
      if (!extractedRaw || extractedRaw.length === 0) {
          alert("No citations were found in the text. Please ensure you pasted text containing references.");
          setIsAnalyzing(false);
          return;
      }

      // Step 2: Verify (Crossref) - Parallel processing
      const verifiedCitations = await Promise.all(
        extractedRaw.map(async (item) => await verifyCitationWithCrossref(item))
      );

      // Step 3: Calculate Metrics
      const verifiedCount = verifiedCitations.filter(c => c.status === VerificationStatus.VERIFIED).length;
      const hallucinatedCount = verifiedCitations.filter(c => c.status === VerificationStatus.HALLUCINATED).length;
      const total = verifiedCitations.length;
      
      const score = total === 0 ? 0 : Math.round((verifiedCount / total) * 100);

      const newReport: AnalysisReport = {
        id: `RPT-${Date.now().toString(36).toUpperCase()}`,
        timestamp: Date.now(),
        totalCitations: total,
        verifiedCount,
        hallucinatedCount,
        overallTrustScore: score,
        citations: verifiedCitations
      };

      setCurrentReport(newReport);
      setHistory(prev => [newReport, ...prev]); // Add to history
      setAnalysisCount(prev => prev + 1);
      setView('report');

    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Unknown error";
      if (msg.includes("Missing API Key")) {
         alert("Configuration Error: API Key not found. Please check Vercel Environment Variables and Redeploy.");
      } else {
         alert(`Analysis failed: ${msg}. Please try again.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
      switch(view) {
          case 'dashboard':
              return user ? (
                  <Dashboard 
                    user={user} 
                    history={history} 
                    onNavigateHome={() => setView('home')}
                    onViewReport={(rpt) => { setCurrentReport(rpt); setView('report'); }}
                  />
              ) : (
                  // Fallback if accessed without auth (shouldn't happen via UI)
                 <div className="text-center py-20">Please log in to view dashboard.</div>
              );
          case 'report':
              return currentReport ? (
                  <AnalysisReportView 
                    report={currentReport} 
                    onReset={() => setView('home')} 
                  />
              ) : <div>No report selected</div>;
          case 'home':
          default:
              return (
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                            Verify Academic Integrity <br/>
                            <span className="text-indigo-600">In Seconds</span>
                        </h1>
                        <p className="text-lg text-slate-600">
                            Detect AI hallucinations and verify citations against the Crossref academic database. 
                            Professional grade accuracy for students and researchers.
                        </p>
                    </div>
                    
                    <InputSection 
                        onAnalyze={handleAnalysis} 
                        isAnalyzing={isAnalyzing}
                        canUpload={!!user?.isPremium}
                        onUpgradeReq={() => { setAuthMode('upgrade'); setIsAuthModalOpen(true); }}
                    />
                </div>
              );
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 flex flex-col">
      <Header 
        user={user} 
        currentView={view}
        onLogin={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} 
        onLogout={handleLogout}
        onNavigate={(v) => setView(v)}
        onPricingClick={() => { setAuthMode('upgrade'); setIsAuthModalOpen(true); }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex-grow w-full">
        {renderContent()}
      </main>

      <footer className="w-full bg-slate-100 border-t border-slate-200 py-6 mt-12 text-center z-40 no-print">
        <div className="max-w-4xl mx-auto px-4">
            <p className="text-xs text-slate-500 leading-relaxed">
                DISCLAIMER: VeriCite Academic is an advanced research verification tool utilizing artificial intelligence and third-party academic databases (Crossref). 
                While we strive for maximum accuracy, this tool is intended to assist, not replace, human judgment. 
                Results may contain errors or omissions. Users are solely responsible for independently verifying the accuracy of all generated reports, citations, and content before use in academic work.
            </p>
            <p className="text-xs text-slate-400 mt-2">
                © {new Date().getFullYear()} VeriCite Academic. All rights reserved.
            </p>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        mode={authMode}
      />
    </div>
  );
};

export default App;
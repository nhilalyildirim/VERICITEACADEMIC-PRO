import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { AnalysisReportView } from './components/AnalysisReport';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { extractCitationsFromText } from './services/geminiService';
import { verifyCitationWithCrossref } from './services/academicService';
import { User, AnalysisReport, VerificationStatus, Citation } from './types';
import { MAX_FREE_ANALYSIS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'upgrade'>('login');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard' | 'report'>('home');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [analysisCount, setAnalysisCount] = useState(0);

  const handleAuthSuccess = (mode: 'login' | 'register' | 'upgrade') => {
    const mockUser: User = { 
        id: 'u1', 
        isPremium: mode === 'upgrade', 
        analysisCount: 0 
    };
    setUser(mockUser);
    setIsAuthModalOpen(false);
    if (mode !== 'upgrade') setView('dashboard');
  };

  const handleAnalysis = async (text: string) => {
    if (!user && analysisCount >= MAX_FREE_ANALYSIS) {
      setAuthMode('upgrade');
      setIsAuthModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setCurrentReport(null);

    try {
      // 1. Extract Citations
      const extractedRaw = await extractCitationsFromText(text);
      if (!extractedRaw || extractedRaw.length === 0) {
          alert("No citations found.");
          setIsAnalyzing(false);
          return;
      }

      // 2. Verify Citations (Batched)
      // We process in small batches to respect the API rate limit (429 errors).
      const BATCH_SIZE = 2; // Reduced batch size for safety
      const verifiedCitations: Citation[] = [];

      for (let i = 0; i < extractedRaw.length; i += BATCH_SIZE) {
          const chunk = extractedRaw.slice(i, i + BATCH_SIZE);
          
          try {
            // Process current chunk in parallel
            const chunkResults = await Promise.all(
                chunk.map((item: any) => verifyCitationWithCrossref(item))
            );
            verifiedCitations.push(...chunkResults);
          } catch (chunkError) {
             console.error("Error processing chunk:", chunkError);
             // If a chunk fails, try to mark them as 'Pending' or 'Error' instead of crashing
             // For now, we just skip them or add simple fallback
             chunk.forEach((item: any) => {
                 verifiedCitations.push({
                     id: Math.random().toString(36).substr(2, 9),
                     originalText: item.original_text || "Error processing",
                     status: VerificationStatus.AMBIGUOUS,
                     confidenceScore: 0,
                     analysisNotes: "Analysis failed due to network error."
                 } as Citation);
             });
          }

          // Delay between batches to allow API quota to recover
          if (i + BATCH_SIZE < extractedRaw.length) {
              await new Promise(resolve => setTimeout(resolve, 2000));
          }
      }

      const verifiedCount = verifiedCitations.filter(c => c.status === VerificationStatus.VERIFIED).length;
      const hallucinatedCount = verifiedCitations.filter(c => c.status === VerificationStatus.HALLUCINATED).length;
      const score = verifiedCitations.length === 0 ? 0 : Math.round((verifiedCount / verifiedCitations.length) * 100);

      const newReport: AnalysisReport = {
        id: `RPT-${Math.floor(Math.random()*10000)}`,
        timestamp: Date.now(),
        totalCitations: verifiedCitations.length,
        verifiedCount,
        hallucinatedCount,
        overallTrustScore: score,
        citations: verifiedCitations
      };

      setCurrentReport(newReport);
      setHistory(prev => [newReport, ...prev]);
      setAnalysisCount(prev => prev + 1);
      setView('report');

    } catch (error: any) {
       console.error(error);
       alert(`Analysis failed: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
      switch(view) {
          case 'dashboard':
              return user ? (
                  <Dashboard user={user} history={history} onNavigateHome={() => setView('home')} onViewReport={(r) => { setCurrentReport(r); setView('report'); }} />
              ) : <div className="text-center p-8">Please login to view dashboard.</div>;
          case 'report':
              return currentReport ? (
                  <AnalysisReportView report={currentReport} onReset={() => setView('home')} />
              ) : <div>No report</div>;
          case 'home':
          default:
              return (
                <div className="max-w-4xl mx-auto py-12">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            VeriCite Academic
                        </h1>
                        <p className="text-lg text-gray-600">
                            Verify citations, detect AI hallucinations, and check source integrity.
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <Header 
        user={user} 
        currentView={view}
        onLogin={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} 
        onRegister={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
        onLogout={() => { setUser(null); setView('home'); }}
        onNavigate={setView}
        onPricingClick={() => { setAuthMode('upgrade'); setIsAuthModalOpen(true); }}
      />
      <main className="container mx-auto px-4 flex-grow">
        {renderContent()}
      </main>
      
      <footer className="w-full border-t bg-white py-10 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-gray-700 mb-6">
                &copy; 2025 VeriCite Academic. All rights reserved.
            </p>
            
            <div className="max-w-3xl mx-auto text-xs text-gray-500 space-y-3 leading-relaxed border-t border-gray-100 pt-6">
                <p>
                    <strong className="text-gray-600">Disclaimer:</strong> VeriCite Academic utilizes advanced artificial intelligence and database cross-referencing to assist in the verification of academic citations. 
                    While we strive for the highest possible accuracy, AI models can occasionally produce errors, hallucinations, or false positives. 
                </p>
                <p>
                    This tool is intended strictly as a research aid and is not a substitute for human academic judgment. 
                    Users are solely responsible for verifying the final accuracy of their citations against original source documents before submission. 
                    VeriCite bears no responsibility for academic integrity violations, grading outcomes, or publication rejections resulting from the use of this service.
                </p>
            </div>

            <div className="flex justify-center gap-6 mt-8 text-xs text-gray-400">
                <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
                <span className="text-gray-300">|</span>
                <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
                <span className="text-gray-300">|</span>
                <a href="#" className="hover:text-blue-600 transition-colors">Academic Integrity Guidelines</a>
            </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </div>
  );
};

export default App;

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
import { verifyCitationWithCrossref } from './services/academicService';
import { storageService, INACTIVITY_LIMIT_MS } from './services/storageService';
import { db } from './services/database'; 
import { User, AnalysisReport, VerificationStatus, Citation } from './types';
import { MAX_FREE_ANALYSIS } from './constants';

type ViewType = 'home' | 'dashboard' | 'report' | 'support' | 'pricing' | 'billing' | 'privacy' | 'terms' | 'integrity';

const App: React.FC = () => {
  // ROUTING LOGIC
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname.startsWith('/admin'));

  useEffect(() => {
    const handlePopState = () => {
        setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- STATE WITH PERSISTENCE INITIALIZATION ---
  
  const [user, setUser] = useState<User | null>(() => storageService.getUserSession());
  
  const [analysisCount, setAnalysisCount] = useState<number>(() => {
    const sessionUser = storageService.getUserSession();
    if (sessionUser) return sessionUser.analysisCount;
    return storageService.getGuestUsage();
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'upgrade'>('login');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<ViewType>('home');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>([]);

  if (isAdminRoute) {
      return <AdminPanel />;
  }

  // --- SESSION MANAGEMENT ---
  useEffect(() => {
    if (!user) return;
    const checkInactivity = () => {
      const lastActive = storageService.getLastActiveTime();
      if (lastActive > 0 && Date.now() - lastActive > INACTIVITY_LIMIT_MS) {
        handleLogout();
      }
    };
    const updateActivity = () => storageService.updateLastActive();
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    const interval = setInterval(checkInactivity, 60000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(interval);
    };
  }, [user]);

  // --- PUBLIC APP LOGIC ---

  const handleLogout = () => {
      if (user) db.logEvent('INFO', `User logged out: ${user.id}`);
      storageService.clearSession();
      setUser(null);
      setAnalysisCount(storageService.getGuestUsage());
      setView('home');
  };

  const handleAuthSuccess = (mode: 'login' | 'register' | 'upgrade', rememberMe: boolean = false) => {
    setIsAuthModalOpen(false);
    
    if (mode === 'upgrade') {
        setView('pricing');
        return;
    }

    const userId = 'u_' + Math.random().toString(36).substr(2, 5);
    const mockUser: User = { 
        id: userId, 
        isPremium: false, 
        analysisCount: 0,
        subscriptionStatus: 'none'
    };

    db.ensureUser(mockUser, 'user@example.com');
    db.logEvent('INFO', `User logged in: ${userId}`);

    storageService.saveUserSession(mockUser, rememberMe);
    setUser(mockUser);
    setAnalysisCount(mockUser.analysisCount);
    setView('dashboard');
  };

  const handleSubscriptionSuccess = () => {
      // Logic has moved to subscriptionService/db
      // Frontend just needs to reload user state from DB source of truth
      if (!user) return;

      // Fetch latest user data (Pro status, subscription status) from DB
      const updatedUser = db.getUser(user.id) as User;
      
      if (updatedUser) {
          setUser(updatedUser);
          // Persist updated session
          const isLocal = !!localStorage.getItem('vericite_user_session_v1');
          storageService.saveUserSession(updatedUser, isLocal);
          
          alert("Successfully upgraded to Pro!");
          setView('billing'); 
      }
  };

  const handleAnalysis = async (text: string) => {
    if (!user?.isPremium && analysisCount >= MAX_FREE_ANALYSIS) {
      setAuthMode('upgrade');
      setIsAuthModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setCurrentReport(null);

    try {
      const extractedRaw = await extractCitationsFromText(text);
      if (!extractedRaw || extractedRaw.length === 0) {
          alert("No citations found.");
          setIsAnalyzing(false);
          return;
      }

      const BATCH_SIZE = 2; 
      const verifiedCitations: Citation[] = [];

      for (let i = 0; i < extractedRaw.length; i += BATCH_SIZE) {
          const chunk = extractedRaw.slice(i, i + BATCH_SIZE);
          try {
            const chunkResults = await Promise.all(
                chunk.map((item: any) => verifyCitationWithCrossref(item))
            );
            verifiedCitations.push(...chunkResults);
          } catch (chunkError) {
             console.error("Error processing chunk:", chunkError);
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

          if (i + BATCH_SIZE < extractedRaw.length) {
              await new Promise(resolve => setTimeout(resolve, 2000));
          }
      }

      const verifiedCount = verifiedCitations.filter(c => c.status === VerificationStatus.VERIFIED).length;
      const hallucinatedCount = verifiedCitations.filter(c => c.status === VerificationStatus.HALLUCINATED).length;
      const score = verifiedCitations.length === 0 ? 0 : Math.round((verifiedCount / verifiedCitations.length) * 100);

      const newReport: AnalysisReport = {
        id: `RPT-${Math.floor(Math.random()*100000)}`,
        timestamp: Date.now(),
        totalCitations: verifiedCitations.length,
        verifiedCount,
        hallucinatedCount,
        overallTrustScore: score,
        citations: verifiedCitations
      };

      const newCount = analysisCount + 1;
      setAnalysisCount(newCount);
      
      const userId = user ? user.id : 'guest';
      
      db.recordAnalysis(newReport, userId);
      db.logEvent('INFO', `Analysis completed. ID: ${newReport.id} Score: ${score}`);

      if (user) {
          const updatedUser = { ...user, analysisCount: newCount };
          setUser(updatedUser);
          const isLocal = !!localStorage.getItem('vericite_user_session_v1');
          storageService.saveUserSession(updatedUser, isLocal);
      } else {
          storageService.saveGuestUsage(newCount);
      }

      setCurrentReport(newReport);
      setHistory(prev => [newReport, ...prev]);
      setView('report');

    } catch (error: any) {
       console.error(error);
       db.logEvent('ERROR', `Analysis failed: ${error.message}`);
       alert(`Analysis failed: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
      switch(view) {
          case 'pricing':
              return (
                <PricingPage 
                    user={user}
                    onBack={() => setView('home')} 
                    onSubscribeSuccess={handleSubscriptionSuccess}
                    onAuthReq={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                />
              );
          case 'billing':
              return user ? (
                  <BillingPage 
                    user={user} 
                    invoices={db.getUserInvoices(user.id)} 
                    onBack={() => setView('dashboard')} 
                  />
              ) : <div className="text-center p-8">Please login to view billing details.</div>;
          case 'support':
              return <SupportPage onBack={() => setView('home')} />;
          case 'privacy':
              return <PrivacyPolicy onBack={() => setView('home')} />;
          case 'terms':
              return <TermsOfService onBack={() => setView('home')} />;
          case 'integrity':
              return <AcademicIntegrity onBack={() => setView('home')} />;
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
          onLogout={handleLogout}
          onNavigate={setView}
          analysisCount={analysisCount}
      />
      <main className="container mx-auto px-4 flex-grow">
        {renderContent()}
      </main>
      
      <footer className="w-full border-t bg-white py-10 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-6">
                  &copy; 2026 VeriCite Academic. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs text-gray-400">
                  <button onClick={() => setView('privacy')} className="hover:text-blue-600 transition-colors">Privacy Policy</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => setView('terms')} className="hover:text-blue-600 transition-colors">Terms of Service</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => setView('integrity')} className="hover:text-blue-600 transition-colors">Academic Integrity Guidelines</button>
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
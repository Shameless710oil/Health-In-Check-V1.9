import React, { useState, useEffect, useRef } from 'react';
import { AppTab, AppState, UserProfile } from './types';
import Navigation from './components/Navigation';
import ScannerTab from './views/ScannerTab';
import FitnessTab from './views/FitnessTab';
import MealsTab from './views/MealsTab';
import ProfileTab from './views/ProfileTab';
import NutrientLogTab from './views/NutrientLogTab';
import RecallsTab from './views/RecallsTab';
import AuthView from './views/AuthView';
import SubscriptionView from './views/SubscriptionView';
import LegalModal from './components/LegalModal';
import BetaWelcomeModal from './components/BetaWelcomeModal';
import AdBanner from './components/AdBanner';
import TelemetryConsole from './telemetry/TelemetryConsole';
import { useTelemetry } from './telemetry/TelemetryProvider';
import { logoutUser } from './services/authService';
import { getUserProfile } from './services/storageService';
import { verifyCheckoutReturnFromUrl } from './services/paymentService';
import { isSupabaseConfigured } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.SCANNER);
  const [appState, setAppState] = useState<AppState>(AppState.PROCESSING);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showBetaWelcome, setShowBetaWelcome] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { setIsConsoleOpen, log } = useTelemetry();

  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);

  const handleHeaderTap = () => {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') return;
    tapCount.current += 1;
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    if (tapCount.current >= 3) {
      setIsConsoleOpen(true);
      log('DEBUG', 'Telemetry Console activated via secret gesture');
      tapCount.current = 0;
    } else {
      tapTimer.current = window.setTimeout(() => { tapCount.current = 0; }, 500);
    }
  };

  useEffect(() => {
    const bootGuestOrSession = async () => {
      try {
        if (typeof window !== 'undefined' && window.location.search) {
          await verifyCheckoutReturnFromUrl(window.location.search);
        }
        const profile = await getUserProfile();
        setUserProfile(profile);
        setAppState(AppState.LANDING);
        log('INFO', 'App booted in frictionless mode', { email: profile.email || 'guest', tier: profile.tier });

        const hasAccepted = localStorage.getItem('fci_legal_accepted');
        if (!hasAccepted) setShowLegalModal(true);

        const hasSeenBeta = sessionStorage.getItem('fci_beta_welcome');
        if (!hasSeenBeta && hasAccepted) setShowBetaWelcome(true);
      } catch (e) {
        log('ERROR', 'Initial session check failed', e);
        const profile = await getUserProfile();
        setUserProfile(profile);
        setAppState(AppState.LANDING);
      }
    };
    bootGuestOrSession();
  }, []);

  const handleAuthSuccess = async () => {
    const profile = await getUserProfile();
    setUserProfile(profile);
    setAppState(AppState.LANDING);
    log('INFO', 'Authentication successful');
  };

  const handleLogout = async () => {
    await logoutUser();
    log('INFO', 'User logged out — returning to Guest Mode');
    const guestProfile = await getUserProfile();
    setUserProfile(guestProfile);
    setAppState(AppState.LANDING);
    setCurrentTab(AppTab.SCANNER);
  };

  const handleAcceptLegal = () => {
    localStorage.setItem('fci_legal_accepted', 'true');
    setShowLegalModal(false);
    log('INFO', 'Legal disclaimer accepted');

    const hasSeenBeta = sessionStorage.getItem('fci_beta_welcome');
    if (!hasSeenBeta) setShowBetaWelcome(true);
  };

  const handleCloseBetaWelcome = () => {
    sessionStorage.setItem('fci_beta_welcome', 'true');
    setShowBetaWelcome(false);
  };

  const handleSubscriptionClose = async () => {
    const refreshed = await getUserProfile();
    setUserProfile(refreshed);
    setAppState(AppState.LANDING);
  };

  if (appState === AppState.PROCESSING && !userProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-teal-500/10 opacity-50 animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="mt-6 text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px] drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">Initializing Core</p>
        </div>
      </div>
    );
  }

  if (appState === AppState.AUTH) {
    return (
      <>
        <AuthView onAuthSuccess={handleAuthSuccess} />
        <TelemetryConsole />
      </>
    );
  }

  const renderTab = () => {
    switch (currentTab) {
      case AppTab.SCANNER:
        return <ScannerTab onShowSubscription={() => setAppState(AppState.SUBSCRIPTION)} />;
      case AppTab.LOG:
        return <NutrientLogTab onShowSubscription={() => setAppState(AppState.SUBSCRIPTION)} />;
      case AppTab.FITNESS:
        return <FitnessTab onShowSubscription={() => setAppState(AppState.SUBSCRIPTION)} />;
      case AppTab.MEALS:
        return <MealsTab onShowSubscription={() => setAppState(AppState.SUBSCRIPTION)} />;
      case AppTab.PROFILE:
        return (
          <ProfileTab
            onShowSubscription={() => setAppState(AppState.SUBSCRIPTION)}
            onLogout={handleLogout}
            onRequestAuth={() => setAppState(AppState.AUTH)}
          />
        );
      case AppTab.RECALLS:
        return <RecallsTab />;
      default:
        return <ScannerTab onShowSubscription={() => setAppState(AppState.SUBSCRIPTION)} />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-200 selection:bg-emerald-500 selection:text-slate-950">
      <LegalModal isOpen={showLegalModal} onAccept={handleAcceptLegal} />
      <BetaWelcomeModal isOpen={showBetaWelcome && !showLegalModal} onClose={handleCloseBetaWelcome} />
      <TelemetryConsole />

      {appState === AppState.SUBSCRIPTION && (
        <SubscriptionView onClose={handleSubscriptionClose} />
      )}

      <header className="p-4 glass sticky top-0 z-40 border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={handleHeaderTap}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-all">
              <span className="font-black text-slate-950 text-2xl italic tracking-tighter">H</span>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-2">
                <span className="font-black tracking-tighter text-white leading-none text-xl uppercase italic">Health-In-Check</span>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest opacity-80 border border-emerald-500/30 px-1 rounded">@food.chem.intel</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isSupabaseConfigured && (
              <span className="text-[9px] font-black text-teal-300 border border-teal-400/30 px-2 py-1 rounded-full bg-teal-400/10">
                LOCAL VAULT
              </span>
            )}
            {userProfile?.tier && userProfile.tier !== 'FREE' && (
              <span className="text-[9px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.4)] border border-white/20">
                {userProfile.tier}
              </span>
            )}
            <div className="text-[9px] font-black tracking-widest text-slate-400 bg-white/5 px-2 py-1 rounded-full border border-white/10">V2.0</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mb-10 pb-20 relative z-10">{renderTab()}</main>

      <div className="fixed bottom-0 left-0 w-full z-40">
        {userProfile && (
          <AdBanner
            userTier={userProfile.tier}
            onUpgrade={() => setAppState(AppState.SUBSCRIPTION)}
          />
        )}
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { AppState, AnalysisReport, HistoryEntry, RecallFeedItem, UserProfile } from '../types';
import Scanner from '../components/Scanner';
import Report from '../components/Report';
import SystemInfo from '../components/SystemInfo';
import { runOCRAgent, runAnalysisAgent } from '../services/geminiService';
import { fetchRealRecalls } from '../services/recallService';
import { getHistory, saveReport, getUserProfile } from '../services/storageService';
import { canPerformAction, incrementUsage } from '../services/authService';
import { FlaskConical, History, Clock, ArrowRight, Lock, Info, Siren, ChevronRight, Cloud, Sparkles, ShieldCheck } from 'lucide-react';

interface ScannerTabProps {
  onShowSubscription: () => void;
}

const ScannerTab: React.FC<ScannerTabProps> = ({ onShowSubscription }) => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [topRecall, setTopRecall] = useState<RecallFeedItem | null>(null);
  const [usageAllowed, setUsageAllowed] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoadingHistory(true);
      const data = await getHistory();
      setHistory(data);
      setLoadingHistory(false);
      await loadSafetyBulletin();
      const usage = await canPerformAction('SCAN');
      setUsageAllowed(usage.allowed);
    };
    loadData();
  }, [appState]);

  const loadSafetyBulletin = async () => {
    const recalls = await fetchRealRecalls(3);
    if (recalls && recalls.length > 0) {
      setTopRecall(recalls[0]);
    }
  };

  const handleScanStart = async () => {
    const check = await canPerformAction('SCAN');
    if (!check.allowed) {
      setError(`Daily limit reached. Upgrade for more scans.`);
      return; 
    }
    setAppState(AppState.PROCESSING);
  };

  const handleScanComplete = async (imageBase64: string, detectedQrData: string | null) => {
    try {
      const ocrResult = await runOCRAgent(imageBase64, detectedQrData);
      const profile = await getUserProfile();
      const analysisReport = await runAnalysisAgent(ocrResult.ingredients || [], ocrResult.qrData, profile, ocrResult.productName);
      await saveReport(analysisReport);
      incrementUsage('SCAN');
      setReport(analysisReport);
      setAppState(AppState.REPORT);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
      setAppState(AppState.SCANNING);
    }
  };

  const renderContent = () => {
    if (showSystemInfo) return <SystemInfo onBack={() => setShowSystemInfo(false)} />;

    switch (appState) {
      case AppState.LANDING:
        return (
          <div className="flex flex-col items-center justify-center pt-16 px-6 pb-24 animate-fade-in">
            
            {/* URGENT SAFETY BULLETIN */}
            {topRecall && (
              <div className="w-full max-w-md mb-10 bg-gradient-to-r from-red-600/20 to-transparent border-l-[6px] border-red-500 glass-bright rounded-r-3xl p-6 flex items-center gap-5 shadow-[0_20px_40px_rgba(239,68,68,0.2)]">
                <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-full shadow-lg shadow-red-500/40 animate-pulse">
                  <Siren className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[10px] text-red-400 font-black uppercase tracking-[0.3em] mb-1">Safety Breach</div>
                  <div className="text-base font-black text-white truncate italic">{topRecall.product_type}</div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{topRecall.hazard}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </div>
            )}

            <div className="relative mb-12 animate-float">
              {/* Restored Turquoise Glow */}
              <div className="absolute inset-0 bg-emerald-500/30 blur-[100px] rounded-full scale-150"></div>
              <div className="relative bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(20,184,166,0.3)] rotate-6 border border-white/20">
                 <FlaskConical className="w-20 h-20 text-slate-950 -rotate-6" />
                 <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-xl">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                 </div>
              </div>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic leading-none">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 drop-shadow-[0_0_20px_rgba(20,184,166,0.4)]">WATCHDOG</span>
              </h1>
              <p className="text-slate-400 max-w-xs mx-auto leading-relaxed text-sm font-black uppercase tracking-widest opacity-70">
                Molecular integrity & toxicology orchestration.
              </p>
            </div>

            <div className="flex flex-col w-full max-w-xs gap-5 mb-16">
              {usageAllowed ? (
                 <button 
                  onClick={() => setAppState(AppState.SCANNING)}
                  className="group relative w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-slate-950 font-black py-6 rounded-[1.5rem] shadow-[0_25px_50px_rgba(20,184,166,0.4)] transition-all hover:scale-[1.05] active:scale-[0.95] overflow-hidden border border-white/20"
                >
                  <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <span className="relative flex items-center justify-center gap-3 text-lg italic">
                    <Sparkles className="w-6 h-6" /> INITIATE SCAN
                  </span>
                </button>
              ) : (
                <button onClick={onShowSubscription} className="w-full glass-bright border-white/10 py-6 rounded-[1.5rem] flex items-center justify-center gap-4 text-slate-500 font-black text-sm tracking-[0.2em] uppercase">
                  <Lock className="w-5 h-5" /> LIMIT EXCEEDED
                </button>
              )}
              <button onClick={() => setShowSystemInfo(true)} className="w-full text-[11px] font-black tracking-[0.5em] text-slate-500 hover:text-emerald-400 transition-colors uppercase italic">
                Engine Blueprints
              </button>
            </div>
            
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6 px-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural History</h3>
                </div>
                {!loadingHistory && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Cloud className="w-3 h-3" /> SYNCED
                  </div>
                )}
              </div>
              
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1,2].map(i => <div key={i} className="h-24 bg-white/5 border border-white/10 rounded-3xl w-full animate-pulse"></div>)}
                </div>
              ) : history.length === 0 ? (
                <div className="p-12 rounded-[2.5rem] border border-white/5 bg-white/[0.02] text-center text-slate-600 text-xs font-black uppercase tracking-[0.4em] italic">
                  Registry Void
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <button key={entry.id} onClick={() => { setReport(entry.report); setAppState(AppState.REPORT); }} className="w-full p-6 rounded-[2rem] glass hover:glass-bright transition-all flex items-center justify-between group border-white/10 shadow-xl">
                      <div className="text-left">
                        <div className="font-black text-white text-lg group-hover:text-emerald-400 transition-colors italic leading-none mb-2">{entry.report.product_name || "Unknown"}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{new Date(entry.date).toDateString()}</div>
                      </div>
                      <div className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl border font-black shadow-2xl transition-all group-hover:scale-110 ${entry.report.overall_score > 70 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'}`}>
                        <span className="text-xl italic leading-none">{entry.report.overall_score}</span>
                        <span className="text-[7px] uppercase tracking-tighter opacity-60">PTS</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case AppState.SCANNING:
        return (
          <div className="pt-8 px-6 pb-24 animate-fade-in">
            <div className="mb-10"><button onClick={() => setAppState(AppState.LANDING)} className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">← Abort Search</button></div>
            <Scanner onScanStart={handleScanStart} onScanComplete={handleScanComplete} onScanError={(msg) => setError(msg)} />
            {error && <div className="mt-10 p-6 glass border-red-500/40 text-red-300 rounded-[2rem] text-xs font-black text-center uppercase tracking-widest leading-loose animate-pulse">{error}</div>}
          </div>
        );

      case AppState.PROCESSING:
        return (
          <div className="flex flex-col items-center justify-center min-h-[75vh] px-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh-system opacity-50"></div>
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-emerald-500/30 blur-[100px] animate-pulse"></div>
              <div className="w-24 h-24 border-[6px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.4)]"></div>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Compiling Reality</h2>
            <p className="text-slate-500 text-sm mt-4 font-black uppercase tracking-[0.2em] max-w-[280px] leading-relaxed">
              Syncing with FDA, USDA, and NIH global safety nodes...
            </p>
          </div>
        );

      case AppState.REPORT:
        return report ? <div className="pt-10 px-6"><Report report={report} onReset={() => setAppState(AppState.LANDING)} onHome={() => setAppState(AppState.LANDING)} /></div> : null;
      
      default: return null;
    }
  };

  return <>{renderContent()}</>;
};

export default ScannerTab;

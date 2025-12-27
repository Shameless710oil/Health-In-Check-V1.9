
import React from 'react';
import { Sparkles, X, Bug, Construction } from 'lucide-react';

interface BetaWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BetaWelcomeModal: React.FC<BetaWelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>
        
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-6 shadow-xl shadow-emerald-500/10">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-black text-white italic tracking-tighter mb-2">Welcome to Beta 1.9</h2>
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">Neural Watchdog Engine</p>
          
          <div className="text-sm text-slate-300 leading-relaxed space-y-4 mb-8 text-left bg-slate-800/50 p-6 rounded-2xl border border-slate-800">
            <p className="flex items-start gap-3">
              <Construction className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span><strong>Work in Progress:</strong> You are using an early version. Features like the Fitness AI and Meal Planner are live but experimental.</span>
            </p>
            <p className="flex items-start gap-3">
              <Bug className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Report Everything:</strong> Use the "Feedback" button in your Profile tab to report bugs or request features.</span>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            I'm Ready to Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default BetaWelcomeModal;

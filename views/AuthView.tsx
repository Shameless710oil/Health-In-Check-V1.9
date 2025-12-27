
import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/authService';
import { FlaskConical, ArrowRight, CheckCircle2, Loader2, Sparkles, ShieldCheck, Lock } from 'lucide-react';
import { PLANS } from '../constants';
import { UserTier } from '../types';

interface AuthViewProps {
  onAuthSuccess: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Email required for node handshake");
      return;
    }
    if (!password) {
        setError("Security key (password) required");
        return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        if (!username) {
            setError("Identity name required");
            setLoading(false);
            return;
        }
        await registerUser(email, username, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || "Encryption handshake failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
      setLoading(true);
      setError(null);
      try {
          await loginUser('admin@health.ai', 'demo');
          onAuthSuccess();
      } catch (e) {
          setError("Demo node offline.");
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Hyper-Gradient Blobs - Turquoise/Emerald Focus */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-emerald-500/20 blur-[150px] rounded-full animate-mesh"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-teal-500/20 blur-[150px] rounded-full animate-mesh" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-16">
           <div className="relative inline-block mb-8 animate-float">
              <div className="absolute inset-0 bg-emerald-500/40 blur-[60px] animate-pulse rounded-full"></div>
              <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/30 shadow-[0_0_50px_rgba(20,184,166,0.5)] rotate-6">
                 <FlaskConical className="w-14 h-14 text-slate-950 -rotate-6" />
              </div>
           </div>
           
           {/* Single Line Branding */}
           <h1 className="text-4xl font-black text-white tracking-tighter mb-3 italic uppercase leading-none whitespace-nowrap">
             Health-In-Check
           </h1>
           <div className="inline-block px-3 py-1 border border-emerald-500/40 rounded-full bg-emerald-500/10 mb-4">
             <span className="text-emerald-400 font-black uppercase tracking-[0.4em] text-[10px]">Watchdog Engine</span>
           </div>
           <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] italic">Neural Health Orchestration</p>
        </div>

        <div className="glass-bright border-white/20 rounded-[3rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500"></div>
          
          <div className="flex gap-6 mb-12 border-b border-white/5 pb-4">
             <button 
               onClick={() => { setIsLogin(false); setError(null); }}
               className={`flex-1 pb-4 text-xs font-black uppercase tracking-[0.3em] transition-all relative italic ${!isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               Register
               {!isLogin && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-fade-in shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>}
             </button>
             <button 
               onClick={() => { setIsLogin(true); setError(null); }}
               className={`flex-1 pb-4 text-xs font-black uppercase tracking-[0.3em] transition-all relative italic ${isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               Login
               {isLogin && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-fade-in shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>}
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 italic">Entity Name</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-[1.25rem] p-5 text-white focus:border-emerald-500/50 outline-none disabled:opacity-50 shadow-inner font-black placeholder:text-slate-800 tracking-tight"
                  placeholder="CHAD WILLINGHAM"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 italic">Neural Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-white/10 rounded-[1.25rem] p-5 text-white focus:border-emerald-500/50 outline-none disabled:opacity-50 shadow-inner font-black placeholder:text-slate-800 tracking-tight"
                placeholder="WATCHDOG@PROTOCOL.IO"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 italic">Security Key</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-white/10 rounded-[1.25rem] p-5 text-white focus:border-emerald-500/50 outline-none disabled:opacity-50 shadow-inner font-black placeholder:text-slate-800 tracking-tight"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-400 text-[11px] font-black uppercase tracking-[0.2em] bg-red-950/40 p-4 rounded-2xl border border-red-500/30 text-center animate-pulse italic leading-relaxed">
                HANDSHAKE_ERR: {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:scale-[1.02] text-slate-950 font-black py-6 rounded-[1.5rem] transition-all shadow-[0_30px_60px_rgba(20,184,166,0.4)] mt-6 flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.98] border border-white/20"
            >
              {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                <>
                  <span className="uppercase tracking-[0.3em] text-sm italic">{isLogin ? 'Initiate Session' : 'Create Identity'}</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>

          {/* DEMO BUTTON */}
          <div className="mt-8 pt-8 border-t border-white/10">
             <button 
                onClick={handleDemoLogin}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-black rounded-[1.5rem] transition-all border border-slate-800 hover:border-emerald-500/30 flex items-center justify-center gap-3 group"
             >
                <ShieldCheck className="w-5 h-5 group-hover:text-emerald-500 transition-colors" />
                <span className="uppercase tracking-[0.3em] text-[10px]">Initiate Admin Demo</span>
             </button>
          </div>

          {!isLogin && !loading && (
            <div className="mt-14 pt-10 border-t border-white/10">
               <div className="flex items-center gap-3 mb-6 justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Core Modules Active:</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {PLANS[UserTier.FREE].features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-tighter bg-white/[0.04] p-3 rounded-2xl border border-white/5 hover:border-white/20 transition-colors">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> {f}
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;


import React, { useState, useEffect } from 'react';
import { AnalysisReport, Recall } from '../types';
import { ShieldAlert, ShieldCheck, RefreshCcw, ExternalLink, Leaf, FlaskConical, AlertTriangle, ArrowRight, Activity, Quote, AlertOctagon, Pill, Siren, CheckCircle2, Sparkles } from 'lucide-react';
import { SAMPLE_QUOTES } from '../constants';

interface ReportProps {
  report: AnalysisReport;
  onReset: () => void;
  onHome: () => void;
}

const Report: React.FC<ReportProps> = ({ report, onReset, onHome }) => {
  const [randomQuote, setRandomQuote] = useState("");
  const [simulatedRecalls, setSimulatedRecalls] = useState<Recall[]>([]);

  useEffect(() => {
    setRandomQuote(SAMPLE_QUOTES[Math.floor(Math.random() * SAMPLE_QUOTES.length)]);
    setSimulatedRecalls(report.recalls || []);
  }, [report]);

  const toggleSimulation = () => {
     if (simulatedRecalls.length > 0) {
        setSimulatedRecalls([]); 
     } else {
        setSimulatedRecalls([
           {
              reason: "Synthetic Pathogen Detected",
              date: "2026-01-12",
              description: "High-level risk simulation activated. Surfacing critical registry documentation for internal audit.",
              source: "Global Health Matrix"
           }
        ]);
     }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-400 via-emerald-600 to-cyan-600 shadow-emerald-500/40';
    if (score >= 50) return 'from-yellow-400 via-orange-500 to-amber-600 shadow-yellow-500/40';
    return 'from-red-500 via-rose-600 to-purple-700 shadow-red-500/40';
  };

  const hasRecalls = simulatedRecalls && simulatedRecalls.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto pb-32 animate-fade-in">
      
      <div className="mb-10 flex justify-between items-center px-2">
        <button onClick={onHome} className="text-slate-500 hover:text-white text-[11px] font-black uppercase tracking-[0.4em] transition-all italic">
          &larr; Exit Data
        </button>
        <div className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] italic flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
          <Sparkles className="w-4 h-4" /> System Verified
        </div>
      </div>

      {/* SCORE HEADER */}
      <div className={`p-12 rounded-[3.5rem] bg-gradient-to-br ${getScoreColor(report.overall_score)} mb-12 text-center relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/20 animate-float`}>
        <div className="relative z-10">
          <h2 className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-950/40 mb-4">Metabolic Integrity Index</h2>
          <div className="text-9xl font-black text-slate-950 tracking-tighter mb-6 italic leading-none drop-shadow-2xl">{report.overall_score}</div>
          <p className="text-base font-black text-slate-950 leading-tight max-w-[320px] mx-auto uppercase tracking-tighter italic border-t border-slate-950/10 pt-4">{report.summary}</p>
        </div>
        <div className="absolute -right-16 -top-16 opacity-10 rotate-12 scale-150">
            <FlaskConical className="w-64 h-64 text-slate-950" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-40"></div>
      </div>

      {/* SAFETY VERIFICATION CARD */}
      <div className="mb-10 glass rounded-[2.5rem] p-8 border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-3xl"></div>
          <div className="flex justify-between items-center mb-8 relative z-10">
             <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Neural Security Audit
             </h3>
             <button 
               onClick={toggleSimulation}
               className="text-[10px] font-black text-slate-600 hover:text-emerald-500 uppercase tracking-[0.2em] transition-colors"
             >
               Simulate Hazard
             </button>
          </div>
          
          <div className="space-y-5 relative z-10">
             <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-500 ${hasRecalls ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                 <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-2xl shadow-2xl ${hasRecalls ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/40' : 'bg-emerald-500/20 text-emerald-400'}`}>
                       {hasRecalls ? <Siren className="w-6 h-6 animate-pulse" /> : <CheckCircle2 className="w-6 h-6" />}
                    </div>
                    <div>
                       <div className={`text-base font-black italic ${hasRecalls ? 'text-red-400' : 'text-white'}`}>Recall Registry Scan</div>
                       <div className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
                          {hasRecalls ? "ALERT: Active Breach Found" : "Status: Biosphere Secure"}
                       </div>
                    </div>
                 </div>
                 {hasRecalls && (
                    <span className="text-[10px] bg-red-600 text-white px-3 py-1.5 rounded-full font-black uppercase tracking-tighter animate-pulse shadow-lg">CRITICAL</span>
                 )}
             </div>

              <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
                 <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-2xl shadow-2xl ${report.hazards.length > 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-600 text-slate-950 shadow-yellow-500/40' : 'bg-emerald-500/20 text-emerald-400'}`}>
                       {report.hazards.length > 0 ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                       <div className="text-base font-black text-white italic">Toxicology Screening</div>
                       <div className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
                          {report.hazards.length > 0 ? `${report.hazards.length} High-Risk Components` : "Zero Hazard Identified"}
                       </div>
                    </div>
                 </div>
             </div>
          </div>
      </div>

      {/* RECALL ALERT DETAILS */}
      {hasRecalls && (
         <div className="mb-10 bg-gradient-to-br from-red-600/10 to-transparent border border-red-500/30 rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
            <h3 className="flex items-center gap-3 text-red-500 font-black mb-8 uppercase text-[12px] tracking-[0.4em] italic">
               <AlertOctagon className="w-6 h-6" />
               Critical Alerts
            </h3>
            <div className="space-y-5">
               {simulatedRecalls.map((recall, i) => (
                  <div key={i} className="glass-bright p-6 rounded-3xl border-white/10 shadow-2xl relative group overflow-hidden">
                     <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="font-black text-red-400 text-lg italic leading-tight">{recall.reason}</div>
                        <span className="text-[10px] bg-red-950 text-red-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-red-500/30 shadow-lg">
                           {recall.date}
                        </span>
                     </div>
                     <p className="text-sm text-slate-300 mb-6 leading-relaxed font-medium relative z-10">{recall.description}</p>
                     <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] flex items-center gap-3 relative z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> AUTHORITY: {recall.source}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* ALLERGY WARNING */}
      {report.allergy_warnings && report.allergy_warnings.length > 0 && (
        <div className="mb-10 bg-gradient-to-r from-red-600 via-rose-600 to-purple-700 rounded-[3rem] p-8 shadow-[0_25px_50px_rgba(239,68,68,0.4)] border border-white/20">
           <h3 className="flex items-center gap-3 text-white font-black mb-5 uppercase text-[12px] tracking-[0.5em] opacity-60 italic">
            <AlertOctagon className="w-6 h-6" />
            Fatal Exclusion
          </h3>
          <div className="space-y-4">
            {report.allergy_warnings.map((warning, i) => (
               <div key={i} className="text-slate-950 font-black text-4xl tracking-tighter italic leading-none drop-shadow-lg">
                 {warning}
               </div>
            ))}
          </div>
        </div>
      )}

      {/* DRUG INTERACTIONS */}
      {report.drug_interactions && report.drug_interactions.length > 0 && (
        <div className="mb-10 glass rounded-[3rem] p-8 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
           <h3 className="flex items-center gap-3 text-indigo-400 font-black mb-8 uppercase text-[12px] tracking-[0.4em] italic">
            <Pill className="w-6 h-6" />
            Biological Interference
          </h3>
          <div className="space-y-5">
            {report.drug_interactions.map((interaction, i) => (
               <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                 <div className="flex justify-between items-start mb-4">
                   <div className="font-black text-white text-lg italic leading-tight">
                      {interaction.medication} <span className="text-indigo-500 mx-1">+</span> {interaction.ingredient}
                   </div>
                   <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg ${
                     interaction.severity === 'High' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                   }`}>
                     {interaction.severity} RISk
                   </span>
                 </div>
                 <p className="text-sm text-slate-300 mb-5 leading-relaxed font-medium">{interaction.effect}</p>
                 <div className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.2em] bg-indigo-500/10 px-4 py-3 rounded-2xl border border-indigo-500/20 italic">PROTOCOL: {interaction.advice}</div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* HAZARDS */}
      {report.hazards.length > 0 && (
        <div className="mb-10 px-2">
          <h3 className="flex items-center gap-3 text-slate-500 font-black mb-8 uppercase text-[12px] tracking-[0.5em] italic">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Pathological Agents
          </h3>
          <div className="space-y-6">
            {report.hazards.map((hazard, idx) => (
              <div key={idx} className="glass border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/10 blur-3xl group-hover:bg-red-500/20 transition-all"></div>
                <div className="flex justify-between items-start mb-5 relative z-10">
                  <h4 className="text-red-400 font-black text-2xl italic leading-none tracking-tighter">{hazard.name}</h4>
                  <span className="text-[10px] font-black bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30 uppercase tracking-[0.2em]">
                    {hazard.risk_level}
                  </span>
                </div>
                <p className="text-slate-300 text-base mb-6 leading-relaxed font-medium relative z-10">{hazard.health_impact}</p>
                <div className="bg-red-500/10 p-5 rounded-2xl text-[12px] text-red-200 font-black italic border-l-4 border-red-500/50 relative z-10 uppercase tracking-tight">
                  "{hazard.verdict}"
                </div>
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10 relative z-10">
                   <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">{hazard.function}</span>
                   {hazard.citation_url && (
                     <a href={hazard.citation_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] text-emerald-400 font-black uppercase tracking-[0.4em] hover:text-emerald-300 transition-colors">
                       RESEARCH <ExternalLink className="w-4 h-4" />
                     </a>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POSITIVES */}
      <div className="mb-12 px-2">
         <h3 className="flex items-center gap-3 text-slate-500 font-black mb-8 uppercase text-[12px] tracking-[0.5em] italic">
            <Leaf className="w-6 h-6 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
            System Optimization
          </h3>
          {report.positives.length === 0 ? (
            <div className="text-slate-600 text-[11px] font-black uppercase tracking-[0.4em] italic p-12 glass rounded-[3rem] text-center border-white/5 bg-white/[0.01]">Zero biochemical assets detected.</div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {report.positives.map((pos, idx) => (
                <div key={idx} className="glass-bright border-white/10 rounded-3xl p-6 shadow-xl group hover:scale-[1.02] transition-all bg-gradient-to-br from-white/[0.05] to-transparent">
                  <div className="flex justify-between items-center mb-3">
                     <h4 className="text-emerald-400 font-black text-xl italic tracking-tighter">{pos.name}</h4>
                     {pos.usda_category && <span className="text-[10px] font-black text-emerald-950 bg-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">{pos.usda_category}</span>}
                  </div>
                  <p className="text-base text-slate-400 leading-relaxed font-medium">{pos.benefit}</p>
                </div>
              ))}
            </div>
          )}
      </div>

      <button 
        onClick={onReset}
        className="w-full py-7 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-700 text-white font-black rounded-[2.5rem] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center justify-center gap-4 transition-all active:scale-[0.98] group"
      >
        <RefreshCcw className="w-6 h-6 text-emerald-400 group-hover:rotate-180 transition-transform duration-700" />
        <span className="uppercase tracking-[0.4em] text-sm italic">New Diagnostic Cycle</span>
      </button>

      <div className="mt-16 text-center text-[10px] text-slate-600 max-w-sm mx-auto space-y-4 font-black uppercase tracking-[0.3em] leading-loose opacity-50">
        <p>Liability Protection: Analysis synthesized by non-sentient watchdog agents. Verify against physical labeling.</p>
        <p>&copy; 2026 Chad Willingham // Health-In-Check Neural Engine</p>
      </div>

    </div>
  );
};

export default Report;

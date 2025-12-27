
import React, { useState, useEffect } from 'react';
import { runRecallFeedAgent } from '../services/geminiService';
import { RecallFeedItem } from '../types';
import { Siren, AlertTriangle, RefreshCcw, ShieldAlert, AlertOctagon, Info } from 'lucide-react';

const RecallsTab: React.FC = () => {
  const [recalls, setRecalls] = useState<RecallFeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecalls();
  }, []);

  const loadRecalls = async () => {
    setLoading(true);
    try {
      const data = await runRecallFeedAgent();
      setRecalls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-600 text-white border-red-500';
      case 'High': return 'bg-orange-600 text-white border-orange-500';
      default: return 'bg-yellow-600 text-white border-yellow-500';
    }
  };

  return (
    <div className="pt-8 px-4 pb-24 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-3 rounded-full">
            <Siren className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Recall Registry</h2>
            <p className="text-slate-400 text-xs">Real-time safety alerts.</p>
          </div>
        </div>
        <button 
          onClick={loadRecalls}
          disabled={loading}
          className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl mb-6 flex gap-3 items-start">
         <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
         <div>
            <h4 className="text-red-300 font-bold text-sm mb-1">Stay Vigilant</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
               These alerts are aggregated from major safety agencies. Always check specific lot codes on your products if you suspect a match.
            </p>
         </div>
      </div>

      {/* List */}
      {loading && recalls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mb-4"></div>
           <p className="text-xs">Scanning Safety Databases...</p>
        </div>
      ) : (
        <div className="space-y-4">
           {recalls.map((item, idx) => (
             <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all">
                
                <div className="p-4 border-b border-slate-800/50 flex justify-between items-start">
                   <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{item.date}</div>
                      <h3 className="font-bold text-white text-lg">{item.product_type}</h3>
                      <div className="text-sm text-slate-400 font-medium">Brand: {item.brand_names || "Various"}</div>
                   </div>
                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getRiskColor(item.risk_level)}`}>
                      {item.risk_level} Risk
                   </span>
                </div>

                <div className="p-4 bg-slate-800/20">
                   <div className="flex items-start gap-3 mb-3">
                      <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                         <span className="text-xs font-bold text-red-300 uppercase">Hazard:</span>
                         <span className="text-sm text-slate-200 ml-2">{item.hazard}</span>
                      </div>
                   </div>
                   
                   <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                      {item.description}
                   </p>

                   <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex gap-3">
                      <Info className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                         <div className="text-xs font-bold text-blue-300 mb-1">Action Required</div>
                         <div className="text-xs text-slate-400">{item.action_required}</div>
                      </div>
                   </div>
                </div>

             </div>
           ))}
        </div>
      )}
      
      <div className="mt-8 text-center">
         <p className="text-[10px] text-slate-600">
            Source: Aggregated Intelligence (FDA/USDA/CDC Simulation)
         </p>
      </div>

    </div>
  );
};

export default RecallsTab;

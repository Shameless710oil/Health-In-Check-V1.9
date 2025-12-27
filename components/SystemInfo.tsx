
import React from 'react';
import { Cpu, Eye, Database, ShieldCheck, ArrowLeft, Network, FileText, ScanLine, BrainCircuit } from 'lucide-react';

interface SystemInfoProps {
  onBack: () => void;
}

const SystemInfo: React.FC<SystemInfoProps> = ({ onBack }) => {
  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">System Architecture</h2>
          <p className="text-slate-400 text-xs">How the Intelligence Engine works.</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Intro Card */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="w-32 h-32 text-indigo-400" />
           </div>
           <h3 className="text-lg font-bold text-white mb-2 relative z-10">Multi-Agent Orchestration</h3>
           <p className="text-sm text-slate-300 relative z-10 leading-relaxed">
             This application does not simply "read" text. It employs a <strong>Multi-Agent System (MAS)</strong> powered by Google Gemini 2.5. 
             Distinct AI agents handle optical recognition, toxicology analysis, and nutritional synthesis in parallel.
           </p>
        </div>

        {/* The Pipeline Visualization */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-2">Processing Pipeline</h3>
          
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pb-4">
            
            {/* Step 1: Ingestion */}
            <div className="relative pl-8">
               <div className="absolute -left-[11px] top-0 bg-slate-900 p-1 rounded-full border border-slate-700">
                  <div className="bg-emerald-500 w-3 h-3 rounded-full animate-pulse"></div>
               </div>
               <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                     <Eye className="w-5 h-5 text-emerald-400" />
                     <h4 className="font-bold text-white text-sm">1. Visual Cortex Agent</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    Hybrid processing uses <strong>Advanced OCR</strong> to extract ingredient lists from curved packaging and <strong>QR Decoding</strong> to fetch digital labels simultaneously.
                  </p>
               </div>
            </div>

            {/* Step 2: Knowledge Retrieval */}
            <div className="relative pl-8">
               <div className="absolute -left-[11px] top-0 bg-slate-900 p-1 rounded-full border border-slate-700">
                  <div className="bg-blue-500 w-3 h-3 rounded-full"></div>
               </div>
               <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                     <Database className="w-5 h-5 text-blue-400" />
                     <h4 className="font-bold text-white text-sm">2. Toxicology Cross-Check</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    Extracted ingredients are queried against an internal <strong>Knowledge Base</strong> of known carcinogens, endocrine disruptors, and banned substances (EU/USA regulatory standards).
                  </p>
               </div>
            </div>

            {/* Step 3: Contextual Analysis */}
            <div className="relative pl-8">
               <div className="absolute -left-[11px] top-0 bg-slate-900 p-1 rounded-full border border-slate-700">
                  <div className="bg-purple-500 w-3 h-3 rounded-full"></div>
               </div>
               <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                     <ShieldCheck className="w-5 h-5 text-purple-400" />
                     <h4 className="font-bold text-white text-sm">3. The Health Guardian</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    The final agent screens for <strong>Drug-Nutrient Interactions</strong> (checking your medications) and <strong>Allergen Compatibility</strong> based on your specific profile.
                  </p>
               </div>
            </div>

             {/* Step 4: Report */}
            <div className="relative pl-8">
               <div className="absolute -left-[11px] top-0 bg-slate-900 p-1 rounded-full border border-slate-700">
                  <div className="bg-orange-500 w-3 h-3 rounded-full"></div>
               </div>
               <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                     <FileText className="w-5 h-5 text-orange-400" />
                     <h4 className="font-bold text-white text-sm">4. Report Generation</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    A synthesis engine compiles the data into a readable score (0-100), suggests healthier alternatives, and provides USDA-backed benefit analysis.
                  </p>
               </div>
            </div>

          </div>
        </div>

        {/* Data Sources Grid */}
        <div>
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Data Sources</h3>
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col items-center text-center">
                 <div className="text-xs font-bold text-white mb-1">USDA FoodData</div>
                 <div className="text-[10px] text-slate-500">Nutritional baselines</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col items-center text-center">
                 <div className="text-xs font-bold text-white mb-1">EFSA & FDA</div>
                 <div className="text-[10px] text-slate-500">Regulatory status</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col items-center text-center">
                 <div className="text-xs font-bold text-white mb-1">NIH PubChem</div>
                 <div className="text-[10px] text-slate-500">Chemical toxicity</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col items-center text-center">
                 <div className="text-xs font-bold text-white mb-1">Gemini Pro 2.5</div>
                 <div className="text-[10px] text-slate-500">Reasoning Engine</div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SystemInfo;

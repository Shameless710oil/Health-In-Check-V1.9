
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Save, PieChart, AlertCircle, Leaf, Apple, Utensils, Droplets, Plus, Minus, Target, Mic, BarChart3, Calendar, ArrowRight, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { DailyFoodLog, DayAnalysis, UserProfile, ReportPeriod, PeriodReport } from '../types';
import { getFoodLog, saveFoodLog, getUserProfile, getLogsForPeriod } from '../services/storageService';
import { runNutrientLogAgent, runIngredientParserAgent, runPeriodSummaryAgent } from '../services/geminiService';
import { canPerformAction, incrementUsage } from '../services/authService';

interface NutrientLogTabProps {
  onShowSubscription: () => void;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const NutrientLogTab: React.FC<NutrientLogTabProps> = ({ onShowSubscription }) => {
  // View Mode: 'LOG' or 'INSIGHTS'
  const [viewMode, setViewMode] = useState<'LOG' | 'INSIGHTS'>('LOG');
  
  // LOG STATE
  const [currentDate, setCurrentDate] = useState(new Date());
  const [log, setLog] = useState<DailyFoodLog>({
    date: new Date().toISOString().split('T')[0],
    breakfast: '',
    lunch: '',
    dinner: '',
    snack: '',
    waterIntake: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string | null>(null);
  const [activeInput, setActiveInput] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
  const [isListening, setIsListening] = useState(false);

  // INSIGHTS STATE
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>(ReportPeriod.WEEK);
  const [periodReport, setPeriodReport] = useState<PeriodReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  useEffect(() => {
    const loadLog = async () => {
      const dateKey = formatDateKey(currentDate);
      const savedLog = await getFoodLog(dateKey);
      if (savedLog.waterIntake === undefined) {
        savedLog.waterIntake = 0;
      }
      setLog(savedLog);
    };
    loadLog();
  }, [currentDate]);

  // --- VOICE LOGIC ---
  const startListening = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Voice dictation not supported in this browser.");
          return;
      }
      
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const currentText = log[meal];
          const newText = currentText ? `${currentText}, ${transcript}` : transcript;
          handleInputChange(meal, newText);
          recognition.stop();
      };
      
      recognition.start();
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    setActiveInput(null);
  };

  const handleInputChange = (meal: keyof DailyFoodLog, value: string) => {
    const updated = { ...log, [meal]: value };
    setLog(updated);
  };

  const handleWaterChange = (change: number) => {
    const current = log.waterIntake || 0;
    const newAmount = Math.max(0, current + change);
    const updated = { ...log, waterIntake: newAmount };
    setLog(updated);
    saveFoodLog(updated);
  };

  const handleSave = () => {
    saveFoodLog(log);
  };

  const handleAnalyze = async () => {
    handleSave();
    if (!log.breakfast && !log.lunch && !log.dinner && !log.snack) {
      alert("Please log at least one meal before analyzing.");
      return;
    }
    const check = await canPerformAction('GENERATE');
    if (!check.allowed) {
        alert("Daily analysis limit reached. Upgrade to Standard.");
        onShowSubscription();
        return;
    }

    setIsAnalyzing(true);
    try {
      const profile = await getUserProfile();
      setAnalysisStep("Mapping Biochemistry...");
      const parsedIngredients = await runIngredientParserAgent(log);
      const logWithIngredients = { ...log, parsedIngredients };
      saveFoodLog(logWithIngredients); 
      setAnalysisStep("Simulating Metabolism...");
      const analysis = await runNutrientLogAgent(logWithIngredients, profile);
      const finalLog = { ...logWithIngredients, analysis };
      setLog(finalLog);
      saveFoodLog(finalLog);
      incrementUsage('GENERATE');
    } catch (e) {
      console.error(e);
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(null);
    }
  };

  const generatePeriodReport = async () => {
      const check = await canPerformAction('GENERATE');
      if (!check.allowed) {
          onShowSubscription();
          return;
      }
      
      setGeneratingReport(true);
      try {
          const profile = await getUserProfile();
          const endDate = new Date();
          const startDate = new Date();
          
          if (reportPeriod === ReportPeriod.WEEK) startDate.setDate(endDate.getDate() - 7);
          if (reportPeriod === ReportPeriod.MONTH) startDate.setDate(endDate.getDate() - 30);
          if (reportPeriod === ReportPeriod.YEAR) startDate.setFullYear(endDate.getFullYear() - 1);
          
          const logs = await getLogsForPeriod(startDate, endDate);
          
          if (logs.length < 3) {
             alert(`Not enough data. Please log at least 3 days to generate a ${reportPeriod} report.`);
             setGeneratingReport(false);
             return;
          }
          
          const report = await runPeriodSummaryAgent(logs, reportPeriod, profile);
          setPeriodReport(report);
          incrementUsage('GENERATE');
      } catch (e) {
          console.error(e);
      } finally {
          setGeneratingReport(false);
      }
  };

  const renderWeekStrip = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const isSelected = formatDateKey(d) === formatDateKey(currentDate);
      days.push(
        <button
          key={i}
          onClick={() => setCurrentDate(d)}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all min-w-[3.5rem] border ${
            isSelected 
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black shadow-xl shadow-emerald-500/30 border-emerald-400 scale-110 relative z-10' 
              : 'glass text-slate-500 border-white/5 hover:border-white/10'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest">{WEEK_DAYS[i]}</span>
          <span className="text-lg font-black">{d.getDate()}</span>
        </button>
      );
    }
    return <div className="flex justify-between items-center p-2 mb-8 gap-1">{days}</div>;
  };

  const renderWaterTracker = () => {
    const intake = log.waterIntake || 0;
    const goal = 10;
    const percentage = Math.min(100, (intake / goal) * 100);
    return (
      <div className="glass rounded-[2rem] p-6 mb-8 border-white/5 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
        <div className="relative z-10 flex items-center justify-between mb-5">
           <div className="flex items-center gap-4">
             <div className="bg-gradient-to-br from-teal-500 to-cyan-400 p-3 rounded-[1.25rem] text-slate-950 shadow-xl shadow-teal-500/20">
                <Droplets className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-white font-black text-base italic leading-tight">Hydration Flux</h3>
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-0.5">Level: {intake} / 10 Units</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => handleWaterChange(-1)} className="w-10 h-10 rounded-xl glass hover:bg-white/10 flex items-center justify-center text-slate-300 transition-all active:scale-90"><Minus className="w-5 h-5" /></button>
              <button onClick={() => handleWaterChange(1)} className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 transition-all active:scale-90"><Plus className="w-5 h-5 font-black" /></button>
           </div>
        </div>
        <div className="mt-2 h-4 bg-slate-900 border border-white/5 rounded-full overflow-hidden relative">
           <div className="h-full bg-gradient-to-r from-teal-600 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(45,212,191,0.5)]" style={{ width: `${percentage}%` }}>
              <div className="absolute inset-0 bg-white/20 w-full animate-shimmer -skew-x-12 translate-x-[-100%]"></div>
           </div>
        </div>
      </div>
    );
  };

  const renderAnalysis = (analysis: DayAnalysis) => {
    const macros = analysis.macro_breakdown || { protein: '0g', carbs: '0g', fats: '0g' };
    return (
      <div className="animate-fade-in mt-10 space-y-8 pb-10">
         <div className="glass border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex-1 pr-4">
                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-black text-2xl uppercase tracking-tighter italic mb-2 leading-none">Intelligence Synthesis</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{analysis.summary}</p>
              </div>
              <div className={`shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-[1.75rem] border-4 shadow-2xl ${
                (analysis.overall_quality_score || 0) > 70 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-yellow-500 text-yellow-400 bg-yellow-500/5'
              }`}>
                 <span className="text-2xl font-black italic">{analysis.overall_quality_score || 0}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 bg-white/[0.03] p-5 rounded-2xl border border-white/5 shadow-inner relative z-10">
               <div className="text-center">
                 <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Protein</div>
                 <div className="font-black text-white text-lg tracking-tighter">{macros.protein || '0g'}</div>
               </div>
               <div className="text-center border-l border-white/5">
                 <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Carbs</div>
                 <div className="font-black text-white text-lg tracking-tighter">{macros.carbs || '0g'}</div>
               </div>
               <div className="text-center border-l border-white/5">
                 <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Fats</div>
                 <div className="font-black text-white text-lg tracking-tighter">{macros.fats || '0g'}</div>
               </div>
            </div>
            <div className="mt-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Estimated Intake: {analysis.calories_total_approx || 0} KCAL</div>
         </div>

         {(analysis.nutrients_missing?.length || 0) > 0 && (
           <div className="bg-red-950/20 border border-red-500/20 rounded-[2rem] p-7 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-red-500 p-2 rounded-xl shadow-lg shadow-red-500/20"><AlertCircle className="w-5 h-5 text-slate-950" /></div>
                 <h3 className="text-red-400 font-black text-lg uppercase tracking-tighter italic">Deficiency Warnings</h3>
              </div>
              <div className="space-y-4">
                 {analysis.recommendations?.map((rec, idx) => (
                    <div key={idx} className="glass p-5 rounded-[1.5rem] border-red-500/10 shadow-xl">
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-red-400 font-black text-[10px] bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/20 italic">
                             Warning: {rec.nutrient}
                          </span>
                       </div>
                       <div className="flex items-start gap-4">
                          <div className="bg-emerald-500/10 p-3 rounded-2xl mt-1 shadow-inner shrink-0">
                             <Apple className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                             <div className="text-emerald-400 font-black text-base italic leading-tight">Eat: {rec.food_to_eat}</div>
                             <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">{rec.reason}</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
         )}
         
         <div className="glass border-white/5 rounded-[2rem] p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
                 <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20"><Leaf className="w-5 h-5 text-slate-950" /></div>
                 <h3 className="text-emerald-400 font-black text-lg uppercase tracking-tighter italic">Bio-Assets Acquired</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
               {analysis.nutrients_received?.map((nut, i) => (
                  <span key={i} className="px-4 py-2 bg-white/5 border border-white/5 text-emerald-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg">
                    {nut.name} <span className="opacity-40 text-[9px] font-black">({nut.amount})</span>
                  </span>
               ))}
            </div>
         </div>
      </div>
    );
  };

  const renderInsightsView = () => (
      <div className="mt-8 animate-fade-in pb-24">
         <div className="flex bg-slate-900 p-1 rounded-xl mb-8 border border-slate-800">
             {[ReportPeriod.WEEK, ReportPeriod.MONTH, ReportPeriod.YEAR].map(p => (
                 <button
                    key={p}
                    onClick={() => { setReportPeriod(p); setPeriodReport(null); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                        reportPeriod === p ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'
                    }`}
                 >
                    {p}
                 </button>
             ))}
         </div>
         
         {!periodReport && !generatingReport && (
             <div className="text-center py-12 px-6 glass rounded-[2.5rem] border-white/5">
                 <BarChart3 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                 <h3 className="text-white font-black text-xl mb-2">Generate {reportPeriod.toLowerCase()} Report</h3>
                 <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Analyze habits, spot deficiencies, and get food suggestions for the selected period.</p>
                 <button 
                    onClick={generatePeriodReport}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-emerald-900/20 hover:scale-105 transition-all flex items-center gap-3 mx-auto uppercase tracking-wider text-xs"
                 >
                    <Zap className="w-4 h-4" /> Synthesize Data
                 </button>
             </div>
         )}
         
         {generatingReport && (
             <div className="py-20 text-center">
                 <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
                 <p className="text-emerald-400 font-black uppercase tracking-widest text-xs animate-pulse">Aggregating Biometrics...</p>
             </div>
         )}
         
         {periodReport && (
             <div className="space-y-6 animate-fade-in">
                 {/* Score Card */}
                 <div className="bg-gradient-to-br from-emerald-500/20 to-teal-900/20 border border-emerald-500/30 p-8 rounded-[2.5rem] text-center relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-10"><Calendar className="w-32 h-32 text-emerald-400" /></div>
                     <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">Health Score</div>
                        <div className="text-7xl font-black text-white italic tracking-tighter mb-4">{periodReport.score}</div>
                        <p className="text-slate-300 text-sm leading-relaxed">{periodReport.summary}</p>
                     </div>
                 </div>
                 
                 {/* Deficiencies */}
                 <div className="glass p-6 rounded-[2rem] border-red-500/20">
                    <h3 className="flex items-center gap-2 text-red-400 font-black uppercase tracking-widest text-xs mb-6">
                        <AlertTriangle className="w-4 h-4" /> Missing Nutrients
                    </h3>
                    <div className="space-y-4">
                        {periodReport.deficiencies.map((def, i) => (
                            <div key={i} className="bg-red-500/10 p-5 rounded-2xl border border-red-500/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-white font-black italic">{def.nutrient}</span>
                                    <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">Deficient</span>
                                </div>
                                <p className="text-xs text-slate-400 mb-3">{def.impact}</p>
                                <div className="flex flex-wrap gap-2">
                                    {def.suggested_foods.map((food, j) => (
                                        <span key={j} className="text-[10px] bg-slate-800 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> {food}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
                 
                 {/* Excessive Intake */}
                 <div className="glass p-6 rounded-[2rem] border-orange-500/20">
                     <h3 className="flex items-center gap-2 text-orange-400 font-black uppercase tracking-widest text-xs mb-6">
                        <TrendingUp className="w-4 h-4" /> Excessive Intake
                    </h3>
                    <div className="space-y-3">
                        {periodReport.excessive_intake.map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                                <div className="bg-orange-500/20 p-2 rounded-lg shrink-0">
                                    <AlertCircle className="w-4 h-4 text-orange-400" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm mb-1">{item.item}</div>
                                    <div className="text-xs text-slate-400 mb-1">{item.risk}</div>
                                    <div className="text-[10px] text-orange-300 font-bold uppercase">{item.advice}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             </div>
         )}
      </div>
  );

  return (
    <div className="pt-10 px-5 min-h-screen">
       {/* HEADER */}
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-indigo-600 p-4 rounded-3xl shadow-2xl shadow-teal-500/20">
                <Utensils className="w-8 h-8 text-white" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Intake <br/><span className="text-teal-400">Log</span></h2>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-slate-800 p-1 rounded-xl">
             <button 
               onClick={() => setViewMode('LOG')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'LOG' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
             >
                <Calendar className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setViewMode('INSIGHTS')}
               className={`p-2 rounded-lg transition-all ${viewMode === 'INSIGHTS' ? 'bg-slate-700 text-emerald-400 shadow' : 'text-slate-500'}`}
             >
                <BarChart3 className="w-5 h-5" />
             </button>
          </div>
       </div>

        {viewMode === 'LOG' ? (
            <>
                <div className="flex items-center justify-between mb-6 px-1">
                <button onClick={() => handleDateChange('prev')} className="p-3 glass hover:bg-white/10 rounded-2xl text-slate-400 transition-all active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic text-center">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => handleDateChange('next')} className="p-3 glass hover:bg-white/10 rounded-2xl text-slate-400 transition-all active:scale-90"><ChevronRight className="w-5 h-5" /></button>
                </div>

                {renderWeekStrip()}
                {renderWaterTracker()}

                <div className="space-y-4">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => (
                    <div key={meal} className="glass border-white/5 rounded-[1.75rem] overflow-hidden shadow-xl transition-all">
                    <button 
                        onClick={() => setActiveInput(activeInput === meal ? null : meal)}
                        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.04] transition-colors"
                    >
                        <span className="font-black uppercase tracking-[0.2em] text-slate-200 text-xs italic">{meal}</span>
                        {log[meal] ? (
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                                <Leaf className="w-3 h-3" /> Logged
                            </span>
                        ) : (
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Void</span>
                        )}
                    </button>
                    {(activeInput === meal || log[meal]) && (
                        <div className="p-5 border-t border-white/5 bg-white/[0.01] animate-fade-in">
                            <div className="relative">
                                <textarea
                                    value={log[meal]}
                                    onChange={(e) => handleInputChange(meal, e.target.value)}
                                    placeholder={`Describe ${meal} intake...`}
                                    rows={3}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium focus:border-teal-500 outline-none resize-none shadow-inner pr-12"
                                />
                                <button 
                                    onClick={() => startListening(meal)}
                                    className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-emerald-400'}`}
                                    title="Voice Dictation"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button onClick={() => { handleSave(); setActiveInput(null); }} className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] hover:text-teal-300 transition-colors flex items-center gap-2">
                                <Save className="w-3.5 h-3.5" /> Commit Log
                                </button>
                            </div>
                        </div>
                    )}
                    </div>
                ))}
                </div>

                <div className="mt-10 mb-24">
                <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full py-6 bg-gradient-to-r from-teal-600 to-indigo-700 hover:from-teal-500 hover:to-indigo-600 text-white font-black rounded-[1.75rem] shadow-2xl shadow-teal-500/30 flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isAnalyzing ? (
                        <>
                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="uppercase tracking-[0.2em] text-xs">{analysisStep || "Synthesizing..."}</span>
                        </>
                    ) : (
                        <>
                        <Target className="w-6 h-6" />
                        <span className="uppercase tracking-[0.2em] text-xs">Analyze Metabolic Load</span>
                        </>
                    )}
                </button>
                </div>
                {log.analysis && renderAnalysis(log.analysis)}
            </>
        ) : (
            renderInsightsView()
        )}
    </div>
  );
};

export default NutrientLogTab;

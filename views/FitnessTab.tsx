
import React, { useState, useEffect } from 'react';
import { runFitnessAgent } from '../services/geminiService';
import { WorkoutRecommendation, UserProfile } from '../types';
import { getUserProfile } from '../services/storageService';
import { canPerformAction, incrementUsage } from '../services/authService';
import { Dumbbell, Activity, Flame, Timer, Play, ChevronDown, ChevronUp, Zap, HelpCircle } from 'lucide-react';
import { SAMPLE_QUOTES } from '../constants';

interface FitnessTabProps {
  onShowSubscription: () => void;
}

const FitnessTab: React.FC<FitnessTabProps> = ({ onShowSubscription }) => {
  const [workout, setWorkout] = useState<WorkoutRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [randomQuote] = useState(SAMPLE_QUOTES[Math.floor(Math.random() * SAMPLE_QUOTES.length)]);
  
  // Track expanded exercise index
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const p = await getUserProfile();
      setProfile(p);
    };
    loadProfile();
  }, []);

  const generateWorkout = async () => {
    // Correctly await the async canPerformAction call
    const check = await canPerformAction('GENERATE');
    if (!check.allowed) {
        // Trigger paywall in parent or show alert
        alert("Daily generation limit reached. Please upgrade to create more workouts.");
        onShowSubscription();
        return;
    }

    if (!profile) return;

    setLoading(true);
    setExpandedIndex(null); // Reset expansions
    try {
      const data = await runFitnessAgent(profile);
      incrementUsage('GENERATE');
      setWorkout(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };

  if (!profile) return null;

  return (
    <div className="pt-8 px-4 pb-24 min-h-screen">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-500/20 p-3 rounded-full">
            <Dumbbell className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Fitness &amp; Fuel</h2>
            <p className="text-slate-400 text-xs">Movement is medicine.</p>
          </div>
        </div>

        {/* Current Profile Context */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
               <div className="text-xs text-slate-500 uppercase font-bold">Current Focus</div>
               <div className="text-purple-400 font-bold">{profile.goal}</div>
            </div>
            <div className="text-right">
               <div className="text-xs text-slate-500 uppercase font-bold">Activity Level</div>
               <div className="text-white text-sm">{profile.activityLevel}</div>
            </div>
        </div>

        {/* Daily Motivation Card */}
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Flame className="w-24 h-24" />
          </div>
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Daily Motivation</h3>
          <p className="text-lg italic text-slate-200 font-serif relative z-10">"{randomQuote}"</p>
        </div>

        {/* Workout Generator */}
        {!workout && !loading && (
          <div className="text-center py-10">
            <div className="bg-purple-900/10 rounded-2xl p-8 border border-purple-500/20 mb-6">
              <Activity className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-white font-bold mb-2">Need a plan for today?</h3>
              <p className="text-slate-400 text-sm mb-6">
                Generate a quick, AI-powered workout tailored for <span className="text-purple-400 font-bold">{profile.goal}</span>.
              </p>
              
              <button 
                onClick={generateWorkout}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                Generate Workout
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-purple-400 animate-pulse">Designing your routine for {profile.goal}...</p>
          </div>
        )}

        {workout && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-bold text-white">Today's Session</h3>
              <button onClick={generateWorkout} className="text-xs text-purple-400 hover:text-white">Refresh</button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-purple-600 p-4">
                 <h4 className="text-xl font-black text-white">{workout.title}</h4>
                 <div className="flex gap-4 mt-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {workout.duration}</span>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {workout.difficulty}</span>
                 </div>
              </div>
              
              <div className="p-0">
                 <div className="divide-y divide-slate-800">
                    {workout.exercises.map((ex, i) => {
                      const isExpanded = expandedIndex === i;
                      
                      return (
                        <div key={i} className="bg-slate-900 hover:bg-slate-800/50 transition-colors">
                           {/* Clickable Header */}
                           <button 
                             onClick={() => toggleExercise(i)}
                             className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                 </div>
                                 <div>
                                    <span className="block text-slate-200 font-bold">{ex.name}</span>
                                    {ex.focus_area && (
                                       <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">{ex.focus_area}</span>
                                    )}
                                 </div>
                              </div>
                              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">{ex.reps}</span>
                           </button>

                           {/* Expanded Instructions */}
                           {isExpanded && (
                             <div className="px-14 pb-6 pt-0 animate-fade-in">
                                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80">
                                   <div className="flex items-center gap-2 mb-3">
                                      <HelpCircle className="w-4 h-4 text-purple-400" />
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">How to Perform</span>
                                   </div>
                                   {ex.instructions && ex.instructions.length > 0 ? (
                                      <ol className="space-y-3 relative border-l-2 border-purple-500/20 ml-1.5 pl-4">
                                         {ex.instructions.map((step, stepIdx) => (
                                           <li key={stepIdx} className="text-sm text-slate-300 leading-relaxed">
                                              <span className="block text-[10px] font-bold text-purple-500 mb-0.5">Step {stepIdx + 1}</span>
                                              {step}
                                           </li>
                                         ))}
                                      </ol>
                                   ) : (
                                     <p className="text-sm text-slate-500 italic">No specific instructions available.</p>
                                   )}
                                   
                                   <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2 items-center">
                                      <Zap className="w-3 h-3 text-yellow-400" />
                                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Keep core engaged</span>
                                   </div>
                                </div>
                             </div>
                           )}
                        </div>
                      );
                    })}
                 </div>

                 <div className="p-6 bg-purple-500/5 border-t border-slate-800">
                    <p className="text-purple-300 text-sm italic text-center">"{workout.motivation}"</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitnessTab;

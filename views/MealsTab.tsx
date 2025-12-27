
import React, { useState } from 'react';
import { runMealAgent } from '../services/geminiService';
import { getUserProfile } from '../services/storageService';
import { canPerformAction, incrementUsage } from '../services/authService';
import { MealRecommendation } from '../types';
import { Utensils, ChefHat, Leaf, RefreshCw } from 'lucide-react';

interface MealsTabProps {
  onShowSubscription: () => void;
}

const MealsTab: React.FC<MealsTabProps> = ({ onShowSubscription }) => {
  const [meal, setMeal] = useState<MealRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  
  const getMeal = async () => {
    // Correctly await the async canPerformAction call
    const check = await canPerformAction('GENERATE');
    if (!check.allowed) {
        alert("Daily generation limit reached. Please upgrade.");
        onShowSubscription();
        return;
    }

    setLoading(true);
    // Correctly await the async getUserProfile call
    const profile = await getUserProfile();
    try {
      const data = await runMealAgent(profile);
      incrementUsage('GENERATE');
      setMeal(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 px-4 pb-24 min-h-screen">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500/20 p-3 rounded-full">
            <Utensils className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Healthy Eats</h2>
            <p className="text-slate-400 text-xs">Fuel your body right.</p>
          </div>
        </div>

        {!meal && !loading && (
           <div className="text-center py-10">
              <div className="bg-blue-900/10 rounded-2xl p-8 border border-blue-500/20">
                <ChefHat className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-white font-bold mb-2">Hungry for something healthy?</h3>
                <p className="text-slate-400 text-sm mb-6">Get a clean-label, whole-food meal idea tailored to your profile & allergies.</p>
                <button 
                  onClick={getMeal}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Leaf className="w-5 h-5" />
                  Suggest a Meal
                </button>
              </div>
           </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-blue-400 animate-pulse">Checking allergies & cooking up ideas...</p>
          </div>
        )}

        {meal && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-bold text-white">Recommended Dish</h3>
              <button onClick={getMeal} className="flex items-center gap-1 text-xs text-blue-400 hover:text-white">
                 <RefreshCw className="w-3 h-3" /> New Idea
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
               <img 
                 src={`https://placehold.co/800x400/1e293b/60a5fa?text=${encodeURIComponent(meal.name)}`} 
                 alt="Meal" 
                 className="w-full h-48 object-cover opacity-80"
                 onError={(e) => (e.currentTarget.style.display = 'none')}
               />
               <div className="p-6 relative">
                 <div className="absolute -top-10 right-4 bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl shadow-lg">
                    <span className="block text-xs text-slate-400 uppercase tracking-wider">Calories</span>
                    <span className="font-bold text-blue-400">~{meal.calories_approx}</span>
                 </div>

                 <h4 className="text-2xl font-black text-white mb-2">{meal.name}</h4>
                 <p className="text-slate-300 text-sm leading-relaxed mb-6">{meal.description}</p>

                 <div className="mb-6">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Key Ingredients</h5>
                    <div className="flex flex-wrap gap-2">
                      {meal.ingredients.map((ing, i) => (
                        <span key={i} className="text-xs bg-slate-800 text-blue-200 px-3 py-1 rounded-full border border-slate-700">
                           {ing}
                        </span>
                      ))}
                    </div>
                 </div>

                 <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                    <h5 className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1">
                       <Leaf className="w-4 h-4" /> Why it's good
                    </h5>
                    <p className="text-xs text-blue-100/80">{meal.benefits}</p>
                 </div>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MealsTab;


import React, { useState, useEffect } from 'react';
import { PLANS } from '../constants';
import { UserTier, UserProfile } from '../types';
import { updateUserTier } from '../services/authService';
import { getUserProfile } from '../services/storageService';
import { Check, Star, Crown, Zap, ChevronLeft } from 'lucide-react';

interface SubscriptionViewProps {
  onClose: () => void;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const p = await getUserProfile();
      setProfile(p);
    };
    loadProfile();
  }, []);

  const currentTier = profile?.tier || UserTier.FREE;

  const handleUpgrade = (tier: UserTier) => {
    // In a real app, this would trigger Stripe/Apple Pay
    if (confirm(`Confirm upgrade to ${PLANS[tier].name} for ${PLANS[tier].price}?`)) {
      updateUserTier(tier);
      onClose();
    }
  };

  const renderCard = (tier: UserTier) => {
    const plan = PLANS[tier];
    const isCurrent = currentTier === tier;
    const isUltra = tier === UserTier.ULTRA;
    const isPremium = tier === UserTier.PREMIUM;

    return (
      <div 
        key={tier} 
        className={`relative rounded-2xl p-6 border transition-all ${
           isCurrent 
             ? 'bg-slate-800/50 border-emerald-500' 
             : isUltra 
               ? 'bg-gradient-to-b from-slate-900 to-purple-900/20 border-purple-500/30 hover:border-purple-400'
               : 'bg-slate-900 border-slate-700 hover:border-slate-500'
        }`}
      >
        {isCurrent && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase">
            Current Plan
          </div>
        )}
        
        <div className="flex items-center gap-3 mb-2">
          {tier === UserTier.FREE && <div className="p-2 bg-slate-800 rounded-lg"><Check className="w-5 h-5 text-slate-400"/></div>}
          {isPremium && <div className="p-2 bg-emerald-500/20 rounded-lg"><Star className="w-5 h-5 text-emerald-400"/></div>}
          {isUltra && <div className="p-2 bg-purple-500/20 rounded-lg"><Crown className="w-5 h-5 text-purple-400"/></div>}
          
          <div>
            <h3 className={`font-bold text-lg ${isUltra ? 'text-purple-300' : 'text-white'}`}>{plan.name}</h3>
            <div className="text-xl font-black text-white">{plan.price}</div>
          </div>
        </div>

        <ul className="space-y-3 mt-6 mb-8">
          {plan.features.map((feature, i) => (
             <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
               <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isUltra ? 'text-purple-400' : 'text-emerald-500'}`} />
               {feature}
             </li>
          ))}
        </ul>

        {!isCurrent && tier !== UserTier.FREE && (
           <button 
             onClick={() => handleUpgrade(tier)}
             className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
               isUltra 
                 ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20' 
                 : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
             }`}
           >
             {isUltra ? <Zap className="w-4 h-4" /> : null}
             Upgrade to {plan.name}
           </button>
        )}
        
        {isCurrent && (
           <button disabled className="w-full py-3 bg-slate-800 text-slate-500 font-bold rounded-xl cursor-not-allowed">
             Active Plan
           </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8">
          <ChevronLeft className="w-5 h-5" /> Back to App
        </button>

        <div className="text-center mb-10">
           <h2 className="text-3xl font-black text-white mb-2">Upgrade your Intelligence</h2>
           <p className="text-slate-400">Unlock unlimited scans and advanced health insights.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pb-20">
           {renderCard(UserTier.FREE)}
           {renderCard(UserTier.PREMIUM)}
           {renderCard(UserTier.ULTRA)}
        </div>

      </div>
    </div>
  );
};

export default SubscriptionView;

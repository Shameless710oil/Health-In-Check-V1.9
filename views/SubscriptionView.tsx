import React, { useState, useEffect } from 'react';
import { PLANS } from '../constants';
import { UserTier, UserProfile } from '../types';
import { getUserProfile } from '../services/storageService';
import { initiateTierCheckout, activateVerifiedTier } from '../services/paymentService';
import { Check, Star, Crown, Zap, ChevronLeft, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface SubscriptionViewProps {
  onClose: () => void;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingTier, setLoadingTier] = useState<UserTier | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sandboxPendingTier, setSandboxPendingTier] = useState<UserTier | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const p = await getUserProfile();
      setProfile(p);
    };
    loadProfile();
  }, []);

  const currentTier = profile?.tier || UserTier.FREE;

  const handleUpgrade = async (tier: UserTier) => {
    if (!profile) return;
    setLoadingTier(tier);
    setNotice(null);
    setSandboxPendingTier(null);

    try {
      const res = await initiateTierCheckout(tier, profile);
      if (res.status === 'redirect' && res.url) {
        window.location.assign(res.url);
        return;
      }

      if (res.canUseLocalSandbox) {
        setSandboxPendingTier(tier);
        setNotice(`Local dev environment detected. Use the Dev Sandbox button below to test ${PLANS[tier].name}.`);
      } else {
        setNotice('Secure Stripe checkout is being connected. Please check back shortly.');
      }
    } finally {
      setLoadingTier(null);
    }
  };

  const handleSandboxActivate = async (tier: UserTier) => {
    const updated = await activateVerifiedTier(tier, 'sandbox_local_session');
    setProfile(updated);
    setSandboxPendingTier(null);
    onClose();
  };

  const renderCard = (tier: UserTier) => {
    const plan = PLANS[tier];
    const isCurrent = currentTier === tier;
    const isPass = tier === UserTier.PASS;
    const isUltra = tier === UserTier.ULTRA;
    const isStandard = tier === UserTier.STANDARD;

    return (
      <div
        key={tier}
        className={`relative rounded-2xl p-6 border transition-all flex flex-col justify-between ${
          isCurrent
            ? 'bg-slate-800/50 border-emerald-500'
            : isPass
              ? 'bg-gradient-to-b from-slate-900 to-teal-900/30 border-teal-400/50 hover:border-teal-300 shadow-lg shadow-teal-950/40'
              : isUltra
                ? 'bg-gradient-to-b from-slate-900 to-purple-900/20 border-purple-500/30 hover:border-purple-400'
                : 'bg-slate-900 border-slate-700 hover:border-slate-500'
        }`}
      >
        <div>
          {isCurrent && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase">
              Current Plan
            </div>
          )}
          {!isCurrent && plan.badge && (
            <div className="mb-3 inline-block bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              {plan.badge}
            </div>
          )}

          <div className="flex items-center gap-3 mb-2">
            {tier === UserTier.FREE && <div className="p-2 bg-slate-800 rounded-lg"><Check className="w-5 h-5 text-slate-400"/></div>}
            {isPass && <div className="p-2 bg-teal-500/20 rounded-lg"><Sparkles className="w-5 h-5 text-teal-400"/></div>}
            {isStandard && <div className="p-2 bg-emerald-500/20 rounded-lg"><Star className="w-5 h-5 text-emerald-400"/></div>}
            {isUltra && <div className="p-2 bg-purple-500/20 rounded-lg"><Crown className="w-5 h-5 text-purple-400"/></div>}

            <div>
              <h3 className={`font-bold text-lg ${isUltra ? 'text-purple-300' : isPass ? 'text-teal-300' : 'text-white'}`}>
                {plan.name}
              </h3>
              <div className="text-xl font-black text-white">{plan.price}</div>
            </div>
          </div>

          <ul className="space-y-3 mt-6 mb-8">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isUltra ? 'text-purple-400' : isPass ? 'text-teal-400' : 'text-emerald-500'}`} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          {!isCurrent && tier !== UserTier.FREE && (
            <button
              onClick={() => handleUpgrade(tier)}
              disabled={loadingTier === tier}
              className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                isUltra
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                  : isPass
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-900/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
              }`}
            >
              {isUltra ? <Zap className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              {loadingTier === tier ? 'Connecting Stripe...' : `Unlock ${plan.name}`}
            </button>
          )}

          {sandboxPendingTier === tier && (
            <button
              onClick={() => handleSandboxActivate(tier)}
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition-all"
            >
              [DEV SANDBOX: Activate {plan.name} Locally]
            </button>
          )}

          {isCurrent && (
            <button disabled className="w-full py-3 bg-slate-800 text-slate-500 font-bold rounded-xl cursor-not-allowed">
              Active Plan
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8">
          <ChevronLeft className="w-5 h-5" /> Back to App
        </button>

        <div className="text-center mb-10">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">
            @food.chem.intel // Watchdog Access
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Upgrade Your Toxicology Intelligence</h2>
          <p className="text-slate-400">
            Start with our one-time $9.99 30-Day Pantry Cleanout Pass or unlock unlimited ongoing audits.
          </p>
        </div>

        {notice && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
          {renderCard(UserTier.FREE)}
          {renderCard(UserTier.PASS)}
          {renderCard(UserTier.STANDARD)}
          {renderCard(UserTier.ULTRA)}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionView;

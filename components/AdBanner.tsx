import React from 'react';
import { UserTier } from '../types';

interface AdBannerProps {
  userTier: UserTier;
  onUpgrade?: () => void;
}

const AdBanner: React.FC<AdBannerProps> = ({ userTier, onUpgrade }) => {
  if (userTier !== UserTier.FREE) return null;

  return (
    <div className="w-full bg-slate-800 border-t border-slate-700 py-3 px-4 relative">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border border-slate-600 px-1 inline-block w-fit mb-1">Ad</span>
          <p className="text-xs text-slate-300">
            Unlock 50 scans/day with the <span className="text-emerald-400 font-bold">$9.99 30-Day Pantry Cleanout Pass</span> or go Unlimited.
          </p>
        </div>
        <button
          onClick={onUpgrade}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded shadow shrink-0"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
};

export default AdBanner;

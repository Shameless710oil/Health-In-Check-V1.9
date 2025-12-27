
import React from 'react';
import { UserTier } from '../types';
import { X } from 'lucide-react';

interface AdBannerProps {
  userTier: UserTier;
}

const AdBanner: React.FC<AdBannerProps> = ({ userTier }) => {
  // Only show for FREE tier
  if (userTier !== UserTier.FREE) return null;

  return (
    <div className="w-full bg-slate-800 border-t border-slate-700 py-3 px-4 relative">
       <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border border-slate-600 px-1 inline-block w-fit mb-1">Ad</span>
             <p className="text-xs text-slate-300">
               Support us! <span className="text-emerald-400 font-bold">Upgrade to Premium</span> to remove ads and get unlimited scans.
             </p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1 px-3 rounded shadow">
            Upgrade
          </button>
       </div>
    </div>
  );
};

export default AdBanner;

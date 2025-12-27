

import React from 'react';
import { ScanLine, Dumbbell, Utensils, User, BookOpen, Siren } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 pb-6 z-50">
      <div className="flex justify-between items-center h-16 max-w-4xl mx-auto px-2">
        <button
          onClick={() => onTabChange(AppTab.SCANNER)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentTab === AppTab.SCANNER ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ScanLine className="w-5 h-5 mb-1" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Scan</span>
        </button>

        <button
          onClick={() => onTabChange(AppTab.RECALLS)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentTab === AppTab.RECALLS ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Siren className="w-5 h-5 mb-1" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Recalls</span>
        </button>

        <button
          onClick={() => onTabChange(AppTab.LOG)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentTab === AppTab.LOG ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Log</span>
        </button>

        <button
          onClick={() => onTabChange(AppTab.FITNESS)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentTab === AppTab.FITNESS ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Dumbbell className="w-5 h-5 mb-1" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Fit</span>
        </button>

        <button
          onClick={() => onTabChange(AppTab.MEALS)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentTab === AppTab.MEALS ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Utensils className="w-5 h-5 mb-1" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Food</span>
        </button>

        <button
          onClick={() => onTabChange(AppTab.PROFILE)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentTab === AppTab.PROFILE ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <User className="w-5 h-5 mb-1" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Me</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;
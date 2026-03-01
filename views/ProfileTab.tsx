
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { UserProfile, HealthGoal, UserTier } from '../types';
import { getUserProfile, saveUserProfile } from '../services/storageService';
import { logoutUser } from '../services/authService';
import { PLANS } from '../constants';
import { User, Ruler, Weight, Activity, Heart, AlertCircle, CheckCircle2, Pill, ShieldAlert, LogOut, CreditCard, Loader2, MessageSquarePlus } from 'lucide-react';
import LegalModal from '../components/LegalModal';
import BetaFeedbackModal from '../components/BetaFeedbackModal';

const GOALS: HealthGoal[] = ['General Health', 'Weight Loss', 'Muscle Gain', 'Endurance', 'Tone & Sculpt'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];

interface ProfileTabProps {
  onShowSubscription: () => void;
  onLogout: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ onShowSubscription, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const p = await getUserProfile();
      setProfile(p);
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const profileSchema = z.object({
    height: z.string().max(20, "Height string too long").optional(),
    weight: z.number().min(0, "Weight cannot be negative").max(1000, "Invalid weight").optional(),
    age: z.number().min(0, "Age cannot be negative").max(150, "Invalid age").optional(),
    goal: z.string().optional(),
    activityLevel: z.string().optional(),
    allergies: z.string().max(500, "Too many characters").optional(),
    medications: z.string().max(500, "Too many characters").optional(),
  });

  const handleChange = (field: keyof UserProfile, value: any) => {
    if (!profile) return;
    setProfile(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      profileSchema.parse({
        height: profile.height,
        weight: profile.weight,
        age: profile.age,
        goal: profile.goal,
        activityLevel: profile.activityLevel,
        allergies: profile.allergies,
        medications: profile.medications
      });
    } catch (e: any) {
      alert(e.errors?.[0]?.message || "Invalid profile data");
      return;
    }

    const sanitizedProfile = {
      ...profile,
      height: DOMPurify.sanitize(profile.height || ''),
      allergies: DOMPurify.sanitize(profile.allergies || ''),
      medications: DOMPurify.sanitize(profile.medications || '')
    };

    setSaving(true);
    await saveUserProfile(sanitizedProfile);
    setProfile(sanitizedProfile);
    setSaving(false);
    setSaved(true);
  };

  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-8 px-4 pb-24 min-h-screen">
      
      <LegalModal 
        isOpen={showLegal} 
        onAccept={() => {}} 
        isViewOnly={true}
        onClose={() => setShowLegal(false)}
      />

      <BetaFeedbackModal 
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-500/20 p-3 rounded-full">
            <User className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Your Profile</h2>
            <p className="text-slate-400 text-xs">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Account/Subscription Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-5">
                <CreditCard className="w-24 h-24" />
             </div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Account & Plan</h3>
             
             <div className="flex items-center justify-between mb-4">
               <div>
                  <div className="text-sm text-slate-400">Current Plan</div>
                  <div className="text-xl font-black text-white">{PLANS[profile.tier].name}</div>
               </div>
               <button 
                 onClick={onShowSubscription}
                 className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
               >
                 Manage / Upgrade
               </button>
             </div>
             
             <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-xs font-bold hover:text-red-300">
               <LogOut className="w-3 h-3" /> Sign Out
             </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Ruler className="w-3 h-3" /> Height
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 5'10"
                    value={profile.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
              </div>
              <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Weight className="w-3 h-3" /> Weight (lbs)
                  </label>
                  <input 
                    type="number" 
                    placeholder="lbs"
                    value={profile.weight}
                    onChange={(e) => handleChange('weight', Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Age
              </label>
              <input 
                type="number" 
                placeholder="Years"
                value={profile.age}
                onChange={(e) => handleChange('age', Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Goal Select */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Heart className="w-3 h-3" /> Health Goal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map(g => (
                  <button
                    key={g}
                    onClick={() => handleChange('goal', g)}
                    className={`text-xs p-2 rounded-lg border transition-all text-left ${
                      profile.goal === g 
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Activity className="w-3 h-3" /> Activity Level
              </label>
              <select 
                value={profile.activityLevel}
                onChange={(e) => handleChange('activityLevel', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
              >
                {ACTIVITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Allergies */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                <AlertCircle className="w-3 h-3" /> Allergies / Intolerances
              </label>
              <textarea 
                rows={2}
                placeholder="e.g. Peanuts, Gluten, Shellfish, Dairy..."
                value={profile.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
                className="w-full bg-red-900/10 border border-red-500/30 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none text-sm"
              />
            </div>

            {/* Medications */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                <Pill className="w-3 h-3" /> Current Medications
              </label>
              <textarea 
                rows={2}
                placeholder="e.g. Warfarin, Lipitor, MAO Inhibitors..."
                value={profile.medications}
                onChange={(e) => handleChange('medications', e.target.value)}
                className="w-full bg-blue-900/10 border border-blue-500/30 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-2">
                *Used to check for adverse food-drug interactions.
              </p>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                saved 
                ? 'bg-green-600 text-white'
                : 'bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50'
              }`}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Saved to Cloud
                </>
              ) : (
                "Save Profile"
              )}
            </button>
            
            {/* BETA FEEDBACK BUTTON */}
            <button 
               onClick={() => setShowFeedback(true)}
               className="w-full py-3 mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Report Bug / Feedback
            </button>

            <button 
              onClick={() => setShowLegal(true)}
              className="w-full py-3 mt-2 border border-slate-700 rounded-xl text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              View Legal Disclaimer
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;

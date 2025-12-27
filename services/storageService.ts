
import { HistoryEntry, AnalysisReport, UserProfile, HealthGoal, UserTier, DailyFoodLog } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'fci_scan_history';
const AUTH_KEY = 'fci_auth_user'; 
const FOOD_LOG_KEY = 'fci_food_log';
const MAX_HISTORY = 20;
const MOCK_SESSION_KEY = 'fci_mock_session';

// --- PROFILE MANAGEMENT ---

const DEFAULT_PROFILE: UserProfile = {
  email: '',
  username: 'Guest',
  tier: UserTier.FREE,
  age: '',
  weight: '',
  height: '',
  allergies: '',
  medications: '',
  activityLevel: 'Moderately Active',
  goal: 'General Health'
};

const ADMIN_PROFILE: UserProfile = {
  email: 'admin@health.ai',
  username: 'System Admin',
  tier: UserTier.ULTRA,
  age: 30,
  weight: 180,
  height: "6'0",
  allergies: 'None',
  medications: 'None',
  activityLevel: 'Very Active',
  goal: 'Tone & Sculpt'
};

export const getUserProfile = async (): Promise<UserProfile> => {
  // Check for mock session first
  const mockSession = localStorage.getItem(MOCK_SESSION_KEY);
  if (mockSession) {
     const user = JSON.parse(mockSession);
     if (user.email === 'admin@health.ai' || user.email === 'admin@test.com') {
        // Return hardcoded Admin profile if not in local storage yet, or merge
        const stored = localStorage.getItem(`${AUTH_KEY}_${user.email}`);
        if (stored) return JSON.parse(stored);
        return { ...ADMIN_PROFILE, email: user.email };
     }
  }

  if (isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data && !error) return data as UserProfile;
      }
    } catch (e) {
      console.warn("Cloud profile fetch failed", e);
    }
  }

  const stored = localStorage.getItem(AUTH_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const mockSession = localStorage.getItem(MOCK_SESSION_KEY);
  
  if (!mockSession && isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update(profile)
          .eq('id', user.id);
      }
    } catch (e) {}
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
  if (profile.email) {
     localStorage.setItem(`${AUTH_KEY}_${profile.email}`, JSON.stringify(profile));
  }
};

// --- HISTORY MANAGEMENT ---

export const getHistory = async (): Promise<HistoryEntry[]> => {
  if (isSupabaseConfigured && !localStorage.getItem(MOCK_SESSION_KEY)) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('scan_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(MAX_HISTORY);
        
        if (data && !error) return data as unknown as HistoryEntry[];
      }
    } catch (e) {}
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveReport = async (report: AnalysisReport): Promise<void> => {
  const newEntry: HistoryEntry = {
    id: Date.now().toString(),
    date: Date.now(),
    report
  };

  if (isSupabaseConfigured && !localStorage.getItem(MOCK_SESSION_KEY)) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('scan_history').insert({
          user_id: user.id,
          product_name: report.product_name,
          report_json: report,
          overall_score: report.overall_score
        });
      }
    } catch (e) {}
  }
  
  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const updated = [newEntry, ...current].slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

// --- FOOD LOG MANAGEMENT ---

export const getFoodLog = async (date: string): Promise<DailyFoodLog> => {
  if (isSupabaseConfigured && !localStorage.getItem(MOCK_SESSION_KEY)) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', date)
          .single();
        
        if (data && !error) return data as unknown as DailyFoodLog;
      }
    } catch (e) {}
  }

  const allLogs = JSON.parse(localStorage.getItem(FOOD_LOG_KEY) || '{}');
  return allLogs[date] || { date, breakfast: '', lunch: '', dinner: '', snack: '', waterIntake: 0 };
};

export const saveFoodLog = async (log: DailyFoodLog): Promise<void> => {
  if (isSupabaseConfigured && !localStorage.getItem(MOCK_SESSION_KEY)) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('food_logs').upsert({
          user_id: user.id,
          log_date: log.date,
          content: log
        });
      }
    } catch (e) {}
  }

  const allLogs = JSON.parse(localStorage.getItem(FOOD_LOG_KEY) || '{}');
  allLogs[log.date] = log;
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(allLogs));
};

// --- RANGE LOGS FOR SUMMARY ---
export const getLogsForPeriod = async (startDate: Date, endDate: Date): Promise<DailyFoodLog[]> => {
    const logs: DailyFoodLog[] = [];
    
    // For local prototype, we iterate the dates and fetch one by one from local storage.
    // In a real optimized Supabase query, we would use .gte('log_date', start).lte('log_date', end)
    
    const current = new Date(startDate);
    while (current <= endDate) {
        const dateKey = current.toISOString().split('T')[0];
        // We reuse getFoodLog which gracefully handles Local/Supabase fallback logic per item
        // Note: For heavy production, this should be a bulk query.
        const log = await getFoodLog(dateKey);
        
        // Only include days where something was actually logged
        if (log.breakfast || log.lunch || log.dinner || log.snack) {
            logs.push(log);
        }
        
        current.setDate(current.getDate() + 1);
    }
    
    return logs;
};

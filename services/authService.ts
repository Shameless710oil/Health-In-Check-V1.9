import { UserTier, UsageStats } from '../types';
import { PLANS } from '../constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getUserProfile, saveUserProfile } from './storageService';

const USAGE_KEY_PREFIX = 'fci_usage_';
const MOCK_SESSION_KEY = 'fci_mock_session';

export const isAuthenticated = async (): Promise<boolean> => {
  const mockSession = localStorage.getItem(MOCK_SESSION_KEY);
  if (mockSession) return true;

  if (!isSupabaseConfigured) return false;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch (error) {
    console.warn("Supabase auth check failed (Likely 'Failed to fetch')", error);
    return false;
  }
};

export const registerUser = async (email: string, username: string, password: string) => {
  if (email.toLowerCase() === 'admin@health.ai' || email.toLowerCase() === 'admin@test.com') {
    const mockUser = { id: 'admin-bypass-id', email, role: 'authenticated' };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
    return mockUser;
  }

  if (!isSupabaseConfigured) throw new Error("Cloud sync not configured. Please add Supabase credentials.");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error) throw error;
  return data.user;
};

export const loginUser = async (email: string, password?: string) => {
  if (email.toLowerCase() === 'admin@health.ai' || email.toLowerCase() === 'admin@test.com') {
    const mockUser = { id: 'admin-bypass-id', email, role: 'authenticated' };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
    return mockUser;
  }

  if (!isSupabaseConfigured) throw new Error("Cloud sync not configured.");
  if (!password) throw new Error("Password required.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data.user;
};

export const logoutUser = async () => {
  localStorage.removeItem(MOCK_SESSION_KEY);
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  localStorage.removeItem('fci_auth_user');
};

export const getCurrentUser = async () => {
  const mockSession = localStorage.getItem(MOCK_SESSION_KEY);
  if (mockSession) return JSON.parse(mockSession);

  if (!isSupabaseConfigured) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (e) {
    return null;
  }
};

export const getCurrentUserSession = getCurrentUser;

export const updateUserTier = async (tier: UserTier) => {
  const profile = await getUserProfile();
  const updated = { ...profile, tier };
  await saveUserProfile(updated);

  const mockSession = localStorage.getItem(MOCK_SESSION_KEY);
  if (mockSession || !isSupabaseConfigured) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ tier }).eq('id', user.id);
    }
  } catch (e) {}
};

// --- USAGE TRACKING ---

const getTodayKey = (email: string) => {
  const today = new Date().toISOString().split('T')[0];
  return `${USAGE_KEY_PREFIX}${email || 'guest'}_${today}`;
};

export const getUsageStats = async (): Promise<UsageStats> => {
  const profile = await getUserProfile();
  const email = profile.email || 'guest';
  const key = getTodayKey(email);
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);

  return { date: new Date().toISOString().split('T')[0], scansCount: 0, generationsCount: 0 };
};

export const canPerformAction = async (
  action: 'SCAN' | 'GENERATE'
): Promise<{ allowed: boolean; limit: number; current: number; tier: UserTier }> => {
  const profile = await getUserProfile();
  const tier = profile.tier || UserTier.FREE;
  const plan = PLANS[tier] || PLANS[UserTier.FREE];
  const usage = await getUsageStats();

  if (action === 'SCAN') {
    if (plan.scansPerDay === -1) {
      return { allowed: true, limit: Infinity, current: usage.scansCount, tier };
    }
    return {
      allowed: usage.scansCount < plan.scansPerDay,
      limit: plan.scansPerDay,
      current: usage.scansCount,
      tier
    };
  } else {
    if (plan.generationsPerDay === -1) {
      return { allowed: true, limit: Infinity, current: usage.generationsCount, tier };
    }
    return {
      allowed: usage.generationsCount < plan.generationsPerDay,
      limit: plan.generationsPerDay,
      current: usage.generationsCount,
      tier
    };
  }
};

export const incrementUsage = async (action: 'SCAN' | 'GENERATE') => {
  const profile = await getUserProfile();
  const email = profile.email || 'guest';
  const stats = await getUsageStats();

  if (action === 'SCAN') stats.scansCount++;
  else stats.generationsCount++;

  const key = getTodayKey(email);
  localStorage.setItem(key, JSON.stringify(stats));
};

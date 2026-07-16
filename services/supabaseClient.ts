
import { createClient } from '@supabase/supabase-js';

/**
 * Health-In-Check Supabase Configuration
 * 
 * Secure connection to the multi-agent backend and user vault.
 */

// CRITICAL: Keys must be loaded from Environment Variables.
// Do not hardcode secrets in this file.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate Environment
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️ Supabase credentials are missing. The application will fall back to local storage mode or block access.",
    "Please create a .env.local file using .env.example as a template."
  );
}

// Flag to check if we have a valid configuration.
export const isSupabaseConfigured = 
  !!SUPABASE_URL && 
  !!SUPABASE_ANON_KEY;

// Initialize the client. 
// If config is missing, we return a dummy client to prevent crash, 
// but authService will detect 'isSupabaseConfigured' is false and fallback to local mode.
export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

/**
 * DATABASE SCHEMA & SECURITY POLICIES
 * 
 * Please run the SQL found in your deployment documentation to set up:
 * 1. profiles (with RLS)
 * 2. scan_history (with RLS)
 * 3. food_logs (with RLS)
 * 4. beta_feedback (with RLS)
 */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Realtime is optional: if the anon key isn't set yet, the app still works
// fully through the Flask API — the leaderboard just won't auto-refresh.
export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 2 } },
    })
  : null;

export const hasRealtime = !!supabase;

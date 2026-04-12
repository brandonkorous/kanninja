import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Frontend Supabase client — used ONLY for:
 * - Realtime subscriptions (broadcast channels)
 * - Presence (board viewers, live cursors)
 *
 * All data queries go through the Fastify API, not this client.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

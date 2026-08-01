import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for tool functions (API routes).
 * Uses the publishable key with RLS policies that allow all operations.
 * This is a simple client without cookies — suitable for API route tool calls.
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env vars"
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

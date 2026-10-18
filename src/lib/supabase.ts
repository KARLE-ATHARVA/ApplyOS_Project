import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isPlaceholderKey =
  !supabasePublishableKey ||
  /^(your_|replace_|<|placeholder)/i.test(supabasePublishableKey.trim()) ||
  supabasePublishableKey === "your_actual_publishable_key";

export function assertSupabaseConfigured(): void {
  if (!supabaseUrl || isPlaceholderKey) {
    throw new Error(
      "Supabase is not configured with a real project key. Set VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to your Supabase project's publishable key (or legacy anon key), then restart the Vite dev server.",
    );
  }
}

if (!supabaseUrl) {
  throw new Error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL in .env.local.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

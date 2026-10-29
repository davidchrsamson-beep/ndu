import { createClient } from "@supabase/supabase-js";

// errand has no logins: every search uses the public key and the
// database's public rules (live vendors and live products only).
export function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
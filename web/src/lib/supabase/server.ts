import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used on the server (loading a storefront, checking who is logged in).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Pages can't set cookies directly. The middleware we add in Step 3 handles it.
          }
        },
      },
    }
  );
}
import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env.public";
import type { Database } from "@/types/database";

/** Cliente de navegador: solo lecturas puntuales y realtime. Las mutaciones van por Server Actions. */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

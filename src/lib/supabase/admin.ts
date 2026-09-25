import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente con clave secreta (salta RLS). SOLO para módulos autorizados:
 * google-drive, cron y purgas. ESLint prohíbe importarlo desde otros sitios.
 */
export function createAdminClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SECRET_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}

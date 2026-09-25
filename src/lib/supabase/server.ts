import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env.public";
import type { Database } from "@/types/database";

/**
 * Cliente de servidor con el JWT del usuario (cookies): RLS se aplica siempre.
 * Úsalo en Server Components, Server Actions y Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Llamado desde un Server Component: no puede escribir cookies.
            // El proxy ya refresca la sesión en cada petición.
          }
        },
      },
    },
  );
}

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/features/auth/utils";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorno del flujo PKCE de Supabase (`?code=`), usado por las plantillas de correo por
 * defecto y, en el futuro, por proveedores OAuth. Intercambia el código por una sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.warn("[auth/callback]", error.code ?? error.message);
  }

  return NextResponse.redirect(new URL("/login?error=enlace", request.url));
}

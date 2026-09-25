import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/features/auth/utils";
import { createClient } from "@/lib/supabase/server";

/** Tipos de enlace que emiten las plantillas de supabase/templates. */
const ALLOWED_TYPES = new Set<EmailOtpType>(["email", "signup", "recovery", "email_change"]);

/**
 * Enlaces de los correos de Auth (confirmación, recuperación, cambio de correo).
 * Verifica el token_hash en servidor y abre la sesión con cookies; funciona aunque
 * el correo se abra en otro navegador o dispositivo.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && type && ALLOWED_TYPES.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.warn("[auth/confirm]", error.code ?? error.message);
  }

  return NextResponse.redirect(new URL("/login?error=enlace", request.url));
}

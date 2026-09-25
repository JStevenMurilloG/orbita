import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env.public";

/** Rutas accesibles sin sesión. Todo lo demás exige usuario autenticado. */
const PUBLIC_PATHS = ["/", "/login", "/registro", "/recuperar", "/restablecer", "/auth"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)));
}

/** Redirección que conserva las cookies de sesión refrescadas en `response`. */
function redirectWithCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

/**
 * Refresca la sesión de Supabase en cada petición y redirige a /login si falta.
 * Es solo UX: la barrera real es requireUser() + RLS.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // No insertar código entre createServerClient y getClaims(): valida el JWT y refresca la sesión.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  if (!isAuthenticated && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Sin trimestres, Hoy lleva al onboarding (plan §11). Se decide aquí y no en la página:
  // /hoy se transmite en streaming (loading.tsx) y un redirect() dentro de la página llegaría
  // al navegador como redirección en cliente, después de pintar. RLS limita el conteo al usuario.
  if (isAuthenticated && pathname === "/hoy") {
    const { count, error } = await supabase
      .from("terms")
      .select("id", { count: "exact", head: true });
    if (!error && count === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/bienvenida";
      url.search = "";
      return redirectWithCookies(url, response);
    }
  }

  return response;
}

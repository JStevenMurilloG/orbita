# ADR-0012: Enlaces de correo de Auth con `token_hash` verificados en servidor

- Estado: aceptado
- Fecha: 2026-09-25

## Contexto

Supabase Auth con `@supabase/ssr` usa el flujo PKCE: el enlace del correo vuelve a la app con un `?code=` que solo se puede canjear en el navegador que guardó el `code_verifier` al pedir el correo. Si el estudiante se registra en el portátil y abre el correo en el móvil, la confirmación o la recuperación de contraseña fallan.

## Decisión

- Las plantillas propias (`supabase/templates/*.html`, en español) enlazan a `/auth/confirm?token_hash=…&type=…&next=…`. El Route Handler llama a `verifyOtp({ type, token_hash })` en servidor y abre la sesión con cookies, sin depender del navegador de origen.
- `/auth/callback` (intercambio PKCE `?code=`) se mantiene para las plantillas por defecto de Supabase y futuros proveedores OAuth.
- `next` se normaliza siempre con `safeNextPath` (solo rutas internas) para evitar redirecciones abiertas.
- `/restablecer` solo permite fijar contraseña sin la actual si la sesión se abrió con un enlace de correo (`amr = otp`) en la última hora; con una sesión normal hay que usar el cambio de contraseña de Configuración, que exige la contraseña actual.

## Consecuencias

- En staging/producción hay que copiar las plantillas al panel de Supabase (Auth → Email Templates); el `site_url` del proyecto debe ser el dominio de la app.
- Los previews de Vercel reciben enlaces al `site_url`, no a la URL del preview (limitación asumida).
- Cerrar sesión "en todos los dispositivos" revoca los refresh tokens; los JWT ya emitidos siguen siendo válidos para leer hasta caducar (`jwt_expiry`, 1 h), aunque las operaciones que consultan la sesión en Auth se rechazan.

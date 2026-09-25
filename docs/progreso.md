# Progreso por fases

Registro de lo que se ha construido en cada fase del [plan maestro](plan-maestro.md) y de lo que queda pendiente. Cada sesión de implementación empieza leyendo este archivo.

| Fase                            | Estado                                  | Fecha      |
| ------------------------------- | --------------------------------------- | ---------- |
| 0 — Arquitectura y base técnica | ✅ Completada (con pendientes externos) | 2026-09-25 |
| 1 — Autenticación y usuarios    | ⏳ Siguiente                            | —          |
| 2–6 (MVP)                       | Pendiente                               | —          |

---

## Fase 0 — Arquitectura y base técnica

### Hecho

- Repositorio git local; Next.js 16.3 (App Router, `src/`, Turbopack), React 19.2, TypeScript estricto, Tailwind 4, shadcn/ui (estilo `radix-nova`), ESLint (flat config) + Prettier (con plugin de Tailwind).
- **Next 16**: `middleware` se llama ahora `proxy` → `src/proxy.ts` + `src/lib/supabase/proxy.ts` (refresco de sesión con `getClaims()` y redirección a `/login?next=`). Los componentes de error reciben `retry` (no `reset`). `params`/`searchParams` son asíncronos. `LayoutProps`/`PageProps` son tipos globales generados por `next typegen`.
- Supabase local (`supabase/config.toml`): puertos **554xx** (API 55421, DB 55422, Studio 55423, Mailpit 55424) porque 543xx lo usa otro proyecto de la máquina. Confirmación de email activada, contraseña mínima 8, cambio de contraseña con reautenticación, redirecciones a `localhost:3000/**`.
- Migración `20260925000000_init.sql`: extensiones (`pgcrypto`, `unaccent`, `pg_trgm`), `set_updated_at()`, `immutable_unaccent()`, `tables_without_rls()` (salvaguarda: los tests exigen 0 tablas sin RLS).
- `src/lib`: `env.ts`/`env.public.ts` (Zod), clientes Supabase `server`/`client`/`admin`, `auth.ts` (`getUser`, `requireUser`), `errors` (`AppError`, códigos §28, mapeo Postgres, `Result<T>`, `toResult`), `dates` (`getToday(tz)`, `zonedWallTimeToInstant` con DST, formateadores es-CO), `validation/common.ts`, `design/course-colors.ts` (12 tokens).
- Tokens de diseño en `globals.css`: marca índigo, colores de urgencia (`--due-*`), paleta de clases `--course-<token>` / `--course-<token>-fg` en claro y oscuro.
- UI: layout raíz en español con `next-themes`, Toaster y Tooltip; `AppShell` (sidebar desktop, cabecera + barra inferior móvil), `TermSwitcher` (esqueleto), `PageHeader`, `ThemeToggle`, `EmptyState`, `ErrorState`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `(app)/loading.tsx`; landing `/`, `/login` (marcador) y `/hoy` (esqueleto protegido).
- Cabeceras de seguridad base en `next.config.ts` (CSP definitiva en Fase 13).
- ESLint prohíbe importar `@/lib/supabase/admin` fuera de google-drive, cron y purgas.
- Tests: Vitest (60 unit/componente, incluido DST en Bogotá/Nueva York/Madrid), pgTAP (5), Playwright (10: home, protección de rutas, 404, axe claro/oscuro × desktop/móvil).
- CI: `.github/workflows/ci.yml` (lint, formato, tipos, cobertura, audit; migraciones + pgTAP + tipos al día; E2E con Supabase local).
- Documentación: ADRs 0001–0011, wireframes (Hoy, Clase, Horario, Tareas), README.

### Pendiente (requiere cuentas del usuario)

- Crear repositorio remoto en GitHub y proteger `main` (el conector de GitHub falló al conectarse en esta sesión).
- Proyectos Supabase **staging** y **prod** (plan Pro en prod) y enlazarlos (`supabase link`).
- Proyecto en Vercel con previews por PR y variables de entorno (`.env.example`).
- Dominio y nombre definitivos (§39 #18), necesarios para Resend (Fase 1) y Google OAuth (Fase 10).

### Notas para la Fase 1

- `profiles` + trigger `on_auth_user_created`; seed con usuarios A y B para tests de acceso cruzado.
- Sustituir el marcador de `/login`; crear `/registro`, `/recuperar`, `/restablecer`, `/auth/callback` (PKCE).
- En local los correos se ven en Mailpit (http://127.0.0.1:55424). SMTP de Resend queda pendiente del dominio.
- Tras cada migración: `npm run db:types` (CI comprueba que los tipos estén al día).

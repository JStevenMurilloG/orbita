# Progreso por fases

Registro de lo que se ha construido en cada fase del [plan maestro](plan-maestro.md) y de lo que queda pendiente. Cada sesión de implementación empieza leyendo este archivo.

| Fase                            | Estado                                  | Fecha      |
| ------------------------------- | --------------------------------------- | ---------- |
| 0 — Arquitectura y base técnica | ✅ Completada (con pendientes externos) | 2026-09-25 |
| 1 — Autenticación y usuarios    | ✅ Completada (con pendientes externos) | 2026-09-25 |
| 2 — Trimestres                  | ✅ Completada                           | 2026-09-25 |
| 3 — Clases y docentes           | ⏳ Siguiente                            | —          |
| 4–6 (MVP)                       | Pendiente                               | —          |

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

- ~~Crear repositorio remoto en GitHub~~ ✅ `JStevenMurilloG/orbita` (push vía alias SSH `github.com-personal`). Falta proteger `main` en GitHub.
- Proyectos Supabase **staging** y **prod** (plan Pro en prod) y enlazarlos (`supabase link`).
- Proyecto en Vercel con previews por PR y variables de entorno (`.env.example`).
- Dominio y nombre definitivos (§39 #18), necesarios para Resend (Fase 1) y Google OAuth (Fase 10).

### Notas para la Fase 1

- `profiles` + trigger `on_auth_user_created`; seed con usuarios A y B para tests de acceso cruzado.
- Sustituir el marcador de `/login`; crear `/registro`, `/recuperar`, `/restablecer`, `/auth/callback` (PKCE).
- En local los correos se ven en Mailpit (http://127.0.0.1:55424). SMTP de Resend queda pendiente del dominio.
- Tras cada migración: `npm run db:types` (CI comprueba que los tipos estén al día).

---

## Fase 1 — Autenticación y usuarios

### Hecho

- **BD** (`20260925010000_profiles.sql`): tabla `profiles` (1:1 con `auth.users`, `ON DELETE CASCADE`): `full_name` 1–100, `timezone` validada contra `pg_timezone_names` (`is_valid_timezone()`), `week_starts_on` 1–7, `theme` light/dark/system, `onboarded_at`, trigger `set_updated_at`. Trigger `on_auth_user_created` (`SECURITY DEFINER`, `search_path = ''`) crea el perfil con nombre y zona de los metadatos, con valores por defecto si faltan o son inválidos. RLS: leer/editar solo el propio; sin INSERT/DELETE para clientes; **privilegios por columna** (solo `full_name`, `timezone`, `week_starts_on`, `theme` son editables).
- **Seed**: usuarios A (`a@orbita.test`) y B (`b@orbita.test`), contraseña `orbita-dev-123`, con identidades y perfiles.
- **Supabase Auth local** (`config.toml`): plantillas en español (`supabase/templates/`: confirmación, recuperación, cambio de correo) con enlaces `token_hash` → `/auth/confirm` (ADR-0012); `localhost:3100` permitido para E2E; límites de sign-in/verificación holgados solo en local/CI.
- **Rutas**: `/login`, `/registro`, `/recuperar`, `/restablecer` (grupo `(auth)` con layout propio), `/auth/confirm` (verifyOtp) y `/auth/callback` (PKCE), `/configuracion` → `/configuracion/perfil` y `/configuracion/cuenta`.
- **features/auth**: esquemas Zod (correo normalizado, contraseña 8–72), `service.ts` (signIn, signUp, reenviar confirmación, recuperación, restablecer, cambio de contraseña verificando la actual, cambio de correo con doble confirmación, cerrar sesión local/global), Server Actions con `Result<T>`, `safeNextPath` contra redirecciones abiertas, `isRecentEmailLinkSession` (`/restablecer` solo con sesión abierta por enlace de correo en la última hora). Registro y recuperación no revelan si el correo existe.
- **features/profile**: `getCurrentProfile` (cacheado por petición), `updateProfileAction`, `updateThemeAction`, `ProfileForm` (nombre, zona IANA con "usar la de este dispositivo", inicio de semana, tema), `UserMenu` (avatar con iniciales, perfil, cuenta, cerrar sesión), `ThemeSync` (el tema del perfil se aplica al entrar desde otro dispositivo; `ThemeToggle` lo guarda en el perfil si hay sesión).
- **lib**: `mapAuthError` (códigos de Supabase Auth → §28; nuevo código `LINK_INVALID`); `toAppError` reconoce errores de Auth; `getUser` expone el método de autenticación (`amr`).
- **Formularios**: React Hook Form + Zod (mismos esquemas en cliente y servidor), `applyServerErrors` (errores por campo con foco o alerta general), `FormField` accesible (`aria-invalid`, `aria-describedby`), `PasswordInput` con mostrar/ocultar, `SubmitButton` con estado.
- **Corrección de Fase 0**: `AppShell` (servidor) pasaba iconos de lucide a `NavLink` (cliente) y rompía toda página con sesión → nuevo `NavList` cliente.
- **Tests**: Vitest 134 (esquemas de auth y perfil, `safeNextPath`, sesión de recuperación, mapeo de errores de Auth, `PasswordInput`); pgTAP 29 (trigger de alta y valores por defecto, anon sin acceso, A↔B sin lectura/edición cruzada, columnas no editables, sin INSERT/DELETE, CHECKs, cascada); Playwright 50 (desktop + móvil): registro → correo (Mailpit) → Hoy → logout → login, zona del navegador, credenciales incorrectas, validación en cliente, `next` interno/externo, recuperación completa, no enumeración, `/restablecer` con sesión normal, perfil persistente, tema entre dispositivos, cambio de contraseña, cambio de correo con doble confirmación, cierre de sesión global, axe claro/oscuro en auth y configuración.

### Pendiente (requiere cuentas del usuario)

- **SMTP con Resend** y dominio propio (SPF/DKIM/DMARC): bloqueado por §39 #18. En local el correo va a Mailpit.
- En staging/prod: copiar `supabase/templates/*` al panel (Auth → Email Templates) con sus asuntos, fijar `site_url` y URLs de redirección, activar la verificación de contraseñas filtradas (plan Pro) y revisar los rate limits de Auth.
- Siguen abiertos los pendientes de Fase 0: proteger `main`, proyectos Supabase staging/prod, Vercel.

### Decisiones y límites conocidos

- `/api/v1` para auth/perfil no se ha construido: la web usa Server Actions sobre la misma capa `service.ts`; se añadirá cuando haya un cliente externo (plan §7).
- Sin rate limiting propio (Upstash): los flujos de auth pasan por los límites de Supabase Auth. Se retoma en Fase 13 o si hay abuso (Turnstile).
- "Cerrar sesión en todos los dispositivos" revoca las sesiones en Auth, pero un JWT ya emitido sigue sirviendo para leer páginas hasta caducar (≤ 1 h); las operaciones que consultan la sesión (p. ej. cambiar correo) se rechazan con `UNAUTHENTICATED`.
- Borrado de cuenta: Fase 13 (plan §11).

### Notas para la Fase 2

- `profiles.active_term_id` con FK compuesta `(active_term_id, id) → terms(id, user_id)` `ON DELETE SET NULL (active_term_id)`; añadirla al `grant update` por columnas de `profiles` (hoy solo 4 columnas son editables) o cambiarla solo vía servicio/RPC.
- `terms.timezone` por defecto = `profiles.timezone` (`getCurrentProfile()`); validar en BD con `public.is_valid_timezone()`.
- Tras el login se va a `/hoy`; en Fase 2 `/hoy` debe llevar a `/bienvenida` si no hay trimestres (y marcar `onboarded_at`).
- Patrón de formularios listo: `src/components/forms/*` + RHF + `applyServerErrors`. Helpers E2E: `tests/e2e/helpers/auth.ts` (`createConfirmedUser`, `login`, `logout`).
- `AppShell` ya recibe `termName`; `TermSwitcher` sigue siendo un esqueleto.

---

## Fase 2 — Trimestres

### Hecho

- **BD** (`20260925020000_terms.sql`): enum `term_status` (`active`/`finished`/`archived`) y tabla `terms` (`user_id default auth.uid()`, nombre 1–80, año 2000–2100, `end_date >= start_date`, `timezone` validada con `is_valid_timezone()`, descripción ≤ 1000, `UNIQUE (id, user_id)` para las FKs compuestas, índice `(user_id, status, start_date desc)`, `set_updated_at`). CHECKs de coherencia estado ↔ `finished_at`/`archived_at`.
  - Trigger `terms_before_write`: zona del perfil por defecto; mantiene `finished_at`/`archived_at`; un trimestre **archivado es de solo lectura** (solo se permite desarchivar `archived → finished` sin tocar otros campos, o eliminarlo) → `P0001 TERM_ARCHIVED`.
  - Trigger `terms_after_insert` (`SECURITY DEFINER`): si el usuario no tiene trimestre activo, el nuevo pasa a serlo (el primero siempre) y marca `profiles.onboarded_at`.
  - RLS con `(select auth.uid())` y **privilegios por columna** (insert: `id` + campos editables; update: campos editables y `status`; nunca `user_id` ni marcas de tiempo).
  - `profiles.active_term_id` con FK compuesta `(active_term_id, id) → terms(id, user_id) ON DELETE SET NULL (active_term_id)`; añadida al `grant update` por columnas de `profiles`.
  - **Plantilla `assert_term_writable()`** para tablas hijas con `term_id`: bloquea INSERT/UPDATE/DELETE si el trimestre (nuevo o anterior) está archivado; deja pasar los borrados en cascada (`pg_trigger_depth() > 1`) para poder eliminar el trimestre o la cuenta. Uso documentado en la migración.
- **Seed**: A tiene "Segundo trimestre" (activo) y "Primer trimestre" (archivado); B tiene "Semestre de otoño".
- **features/terms**: esquemas Zod (mismos límites que la BD, orden de fechas en `end_date`), `service.ts` (listar, obtener, crear con aviso de solapamiento, editar, transiciones finalizar/reabrir/archivar/desarchivar validadas en servidor y BD, eliminar verificando el nombre, `setActiveTerm`, `hasAnyTerm`), Server Actions `requireUser → parse → service → Result<T>`, `queries.ts` (`getCurrentTerms`, `getActiveTerm`, cacheadas por petición), utilidades puras (`nextTermStatus`, `termPeriod`, `newTermDefaults` con "hoy" en la zona del perfil).
- **UI**: `TermSwitcher` funcional (desktop y móvil; en curso/finalizados y archivados por separado; enlaces a todos y a nuevo), `/trimestres` (lista en curso/finalizados + archivados), `/trimestres/nuevo` (casilla "Usarlo como trimestre activo"), `/trimestres/[termId]` (resumen, usar como activo, finalizar/reabrir, archivar con `ArchiveTermDialog`, edición, eliminar con `DeleteTermDialog`: diálogo + escribir el nombre exacto, comprobado de nuevo en servidor), `/bienvenida` (onboarding con layout propio), `ReadOnlyBanner` con "Desarchivar" (en el layout si el activo está archivado, o en la página del trimestre consultado), `TermStatusBadge`, `/hoy` muestra el trimestre activo y avisa si hoy cae fuera de sus fechas.
- **Onboarding**: sin trimestres, `/hoy` → `/bienvenida` (redirección en el proxy, 307 real) y el login va directo a `/bienvenida`.
- **lib**: `formatCivilDate` / `formatCivilDateRange` (fechas civiles sin corrimiento de zona). shadcn: `dialog`, `alert-dialog`, `textarea`.
- **Accesibilidad**: `--destructive` en claro oscurecido (el botón destructivo de shadcn daba 4.0:1) y colores "rich" de Sonner en claro oscurecidos (verde/azul/ámbar < 4.5:1). La auditoría axe espera a que terminen las animaciones.
- **Tests**: Vitest 179 (esquemas y utilidades de trimestres, formato de fechas civiles); pgTAP 78 (49 nuevos: estructura, FK compuesta de `active_term_id`, A↔B sin lectura/edición/borrado cruzado, B no puede activar ni colgar hijos de trimestres de A, CHECKs, privilegios por columna, primer trimestre activo + onboarding, ciclo de vida y solo lectura, plantilla `assert_term_writable` sobre una tabla hija temporal, cascadas); Playwright 66 (desktop + móvil): onboarding, crear varios y cambiar el activo (persistente), finalizar/reabrir/archivar/consultar/desarchivar, editar, eliminar con doble confirmación, aislamiento entre usuarios, axe claro/oscuro en onboarding, trimestres y trimestre archivado.

### Decisiones y límites conocidos

- El estado `active` se muestra como **"En curso"** para no confundirlo con el **trimestre activo** (la selección del usuario).
- Archivar se permite desde "en curso" o "finalizado" (fija también `finished_at`); desarchivar lo deja "finalizado". Un trimestre archivado se puede eliminar.
- Solapamiento de fechas permitido: crear/editar devuelve `overlaps` y la UI muestra un aviso.
- El redirect a `/bienvenida` no se hace en la página `/hoy`: con `(app)/loading.tsx` la página se transmite en streaming y un `redirect()` llegaría como redirección en cliente tras pintar. Se hace en el proxy (solo para `/hoy`, una consulta `count` con RLS). Además, el redirect de una Server Action no actualiza la URL si el destino vuelve a redirigir, por eso `loginAction` decide el destino él mismo.
- `/api/v1/terms` no se ha construido (misma decisión que en Fase 1: se añadirá con el primer cliente externo; la capa `service.ts` ya está lista).
- El borrado de un trimestre con archivos en Storage necesitará el job de purga (Fase 8).

### Pendiente (requiere cuentas del usuario)

- Siguen abiertos los pendientes de Fases 0 y 1: proteger `main`, proyectos Supabase staging/prod, Vercel, SMTP con Resend y dominio.

### Notas para la Fase 3

- `courses`: FK `(term_id, user_id) → terms(id, user_id) ON DELETE CASCADE`, `UNIQUE (id, user_id)` y `UNIQUE (id, term_id, user_id)` (plan §8), `color` con CHECK contra los 12 tokens de `src/lib/design/course-colors.ts`, soft delete (`deleted_at`) e índice `(term_id, position) where deleted_at is null`. Añadir el trigger `courses_assert_term_writable` con `public.assert_term_writable()` y probarlo en pgTAP (ver `supabase/tests/020_terms.test.sql`).
- `teachers` no tiene `term_id` (reutilizables entre trimestres) → no lleva la plantilla; `course_teachers` sí depende de una clase: bloquear su escritura si la clase está en un trimestre archivado (trigger propio que resuelva el `term_id` de la clase).
- Contexto: `getActiveTerm()` / `getCurrentTerms()` (`features/terms/queries`). `/clases` debe redirigir a `/trimestres/[activeTermId]/clases`; sin trimestre activo, a `/trimestres`. En trimestres archivados, ocultar/deshabilitar crear y editar (el `ReadOnlyBanner` ya se muestra) y mapear `TERM_ARCHIVED` (409) en los formularios.
- Aislamiento: crear una clase en un trimestre ajeno debe fallar por la FK compuesta (23503 → `NOT_FOUND`).
- Helpers E2E: `tests/e2e/helpers/terms.ts` (`createFirstTerm`, `createTerm`, `switchActiveTerm`); tras `login()` un usuario nuevo está en `/bienvenida`.
- Componentes disponibles: `Dialog`, `AlertDialog`, `Textarea`, `FormField`, `DeleteTermDialog` como patrón de confirmación fuerte.

@AGENTS.md

# Órbita — pautas del proyecto

- Plan: `docs/plan-maestro.md` (fuente de verdad). Progreso y pendientes: `docs/progreso.md` — léelo al empezar y actualízalo al cerrar cada fase.
- Interfaz en español; código, tablas y columnas en inglés (`terms` = trimestres, `courses` = clases, `notes` = apuntes).
- Cada Server Action: `requireUser()` → `schema.parse()` → `service` → `Result<T>` (`src/lib/errors`). Nunca aceptar `user_id` del cliente.
- Cada tabla nueva: `user_id default auth.uid()`, RLS con `(select auth.uid())`, FKs compuestas `(parent_id, user_id)`, trigger `set_updated_at`, tests pgTAP de acceso cruzado A↔B, y `npm run db:types`.
- Fechas: nunca "hoy" con la hora del servidor; usar `src/lib/dates` con la zona del perfil/trimestre.
- Supabase local usa puertos 554xx (`npm run db:start`). Correo local: http://127.0.0.1:55424.
- Antes de cerrar una fase: `npm run check`, `npm run test:db`, `npm run test:e2e`, `npm run format:check`.
- Git: remoto `origin` = `git@github.com-personal:JStevenMurilloG/orbita.git` (alias SSH de la cuenta personal en `~/.ssh/config`). Al cerrar cada fase: commit y `git push origin main`.

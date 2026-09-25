# Órbita

Plataforma personal de gestión académica: trimestres, clases, docentes, horario, dashboard diario y tareas (MVP), y más adelante calendario, cuadernos, documentos, Google Drive, recordatorios y búsqueda.

- Plan técnico completo: [docs/plan-maestro.md](docs/plan-maestro.md)
- Decisiones de arquitectura: [docs/adr/](docs/adr/)
- Wireframes: [docs/wireframes.md](docs/wireframes.md)
- Estado por fases: [docs/progreso.md](docs/progreso.md)

## Stack

Next.js 16 (App Router, `src/proxy.ts`) · React 19 · TypeScript estricto · Tailwind CSS 4 · shadcn/ui (Radix) · Supabase (PostgreSQL + RLS, Auth, Storage) · Zod · date-fns + @date-fns/tz · Vitest · pgTAP · Playwright.

## Requisitos

- Node.js ≥ 20.9 (recomendado 22)
- Docker (para Supabase local)

## Puesta en marcha

```bash
npm install
npm run db:start          # Supabase local (API en :55421, Studio en :55423, correo en :55424)
cp .env.example .env.local
npx supabase status -o env  # copia URL y claves a .env.local
npm run dev               # http://localhost:3000
```

Los puertos de Supabase local usan el rango 554xx para no chocar con otros proyectos.

## Scripts

| Script                           | Qué hace                                              |
| -------------------------------- | ----------------------------------------------------- |
| `npm run dev`                    | Servidor de desarrollo                                |
| `npm run check`                  | Lint + tipos + tests unitarios                        |
| `npm run test` / `test:coverage` | Vitest                                                |
| `npm run test:db`                | pgTAP (RLS, restricciones) contra Supabase local      |
| `npm run test:e2e`               | Playwright (compila y levanta la app en :3100)        |
| `npm run db:reset`               | Recrea la BD local aplicando migraciones y `seed.sql` |
| `npm run db:types`               | Regenera `src/types/database.ts`                      |
| `npm run format`                 | Prettier                                              |

## Estructura

```
src/app/          rutas (App Router): (auth) públicas, (app) protegidas
src/features/     un módulo por dominio: actions, service, schemas, components
src/components/   ui (shadcn), layout (AppShell), feedback (estados)
src/lib/          supabase, errors (AppError/Result), dates, validation, design, env
supabase/         config, migrations, tests (pgTAP), seed
tests/e2e/        Playwright
```

## Reglas de seguridad

- Toda Server Action / Route Handler empieza con `requireUser()` y valida con Zod.
- Las consultas usan el cliente con el JWT del usuario (RLS). `lib/supabase/admin.ts` solo en módulos autorizados (ESLint lo impide en el resto).
- Cada tabla nueva: RLS + FKs compuestas `(parent_id, user_id)` + tests pgTAP de acceso cruzado.

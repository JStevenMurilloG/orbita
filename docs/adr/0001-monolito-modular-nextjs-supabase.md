# ADR-0001: Monolito modular Next.js + Supabase

- Estado: aceptado
- Fecha: 2026-09-25

## Contexto

Órbita es una aplicación personal multiusuario de tamaño medio (un estudiante, cientos a miles de filas). Se necesita autenticación, base relacional con aislamiento por usuario, almacenamiento de archivos y jobs programados, con un equipo muy pequeño.

## Decisión

Una sola aplicación **Next.js (App Router)** organizada por dominios (`src/features/*`) desplegada en Vercel, sobre **Supabase** (PostgreSQL + RLS, Auth, Storage, pg_cron, Edge Functions). Sin microservicios ni backend separado.

## Consecuencias

- Cero operación de infraestructura; previews por PR.
- La lógica de dominio vive en `features/*/service.ts`, reutilizable por Server Actions y `/api/v1`.
- Salida posible: Supabase es Postgres estándar y Next.js es autoalojable.

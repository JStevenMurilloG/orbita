# ADR-0002: supabase-js + SQL puro, sin ORM

- Estado: aceptado
- Fecha: 2026-09-25

## Contexto

Los ORM (Prisma, Drizzle) se conectan normalmente con un rol privilegiado y **se saltan RLS**, que es nuestra barrera principal de aislamiento.

## Decisión

Acceso a datos con `supabase-js` usando siempre el JWT del usuario (RLS aplicado) y tipos generados con `supabase gen types`. Esquema, políticas, triggers y funciones en migraciones SQL (`supabase/migrations`).

## Consecuencias

- RLS se aplica automáticamente en cada consulta del usuario.
- Consultas complejas se implementan como funciones RPC `SECURITY INVOKER`.
- Se pierde el query builder tipado de un ORM; se compensa con los tipos generados.

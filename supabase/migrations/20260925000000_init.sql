-- Fase 0 · Migración inicial: extensiones y utilidades comunes.
-- Las tablas de dominio llegan a partir de la Fase 1 (ver docs/plan-maestro.md §8).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Mantiene updated_at en todas las tablas mutables (trigger BEFORE UPDATE).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: fija updated_at = now().';

-- unaccent() no es IMMUTABLE; este envoltorio permite usarlo en columnas generadas e índices (búsqueda, Fase 12).
create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, input);
$$;

-- Salvaguarda del checklist de seguridad (§31): lista tablas de public sin RLS.
-- Los tests pgTAP exigen que devuelva 0 filas.
create or replace function public.tables_without_rls()
returns table (table_name text)
language sql
stable
set search_path = ''
as $$
  select c.relname::text
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity;
$$;

revoke execute on function public.tables_without_rls() from public, anon, authenticated;

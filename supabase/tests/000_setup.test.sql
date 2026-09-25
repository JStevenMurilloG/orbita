-- Fase 0 · Comprobaciones base de la BD.
begin;
select plan(5);

select has_extension('extensions', 'pgcrypto', 'pgcrypto instalado');
select has_extension('extensions', 'unaccent', 'unaccent instalado');
select has_extension('extensions', 'pg_trgm', 'pg_trgm instalado');

select is(public.immutable_unaccent('Cálculo Diferencial'), 'Calculo Diferencial', 'immutable_unaccent quita tildes');

select is_empty(
  'select * from public.tables_without_rls()',
  'Todas las tablas de public tienen RLS activado'
);

select * from finish();
rollback;

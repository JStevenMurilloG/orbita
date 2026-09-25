-- Fase 2 · terms: aislamiento A ↔ B, FK compuesta de active_term_id, ciclo de vida y
-- plantilla assert_term_writable (plan §12, §26, §29).
begin;
select plan(49);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'pgtap-a@orbita.test',
   '{"full_name":"Usuaria A","timezone":"Europe/Madrid"}'),
  ('22222222-2222-4222-8222-222222222222', 'pgtap-b@orbita.test',
   '{"full_name":"Usuario B","timezone":"America/Bogota"}');

-- Estructura ------------------------------------------------------------------
select has_table('public', 'terms', 'existe la tabla terms');
select has_column('public', 'profiles', 'active_term_id', 'profiles tiene active_term_id');
select col_is_unique('public', 'terms', array['id', 'user_id'], 'terms expone UNIQUE (id, user_id)');
select fk_ok(
  'public', 'profiles', array['active_term_id', 'id'],
  'public', 'terms', array['id', 'user_id'],
  'active_term_id es FK compuesta (active_term_id, id) → terms(id, user_id)'
);
select has_trigger('public', 'terms', 'terms_set_updated_at', 'terms mantiene updated_at');
select has_function('public', 'assert_term_writable', 'existe la plantilla assert_term_writable()');

-- Tabla hija de ejemplo para probar la plantilla (solo vive en esta transacción).
create table public.pgtap_term_children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  term_id uuid not null,
  label text not null,
  foreign key (term_id, user_id) references public.terms (id, user_id) on delete cascade
);
create trigger pgtap_term_children_assert_term_writable
  before insert or update or delete on public.pgtap_term_children
  for each row execute function public.assert_term_writable();
grant select, insert, update, delete on public.pgtap_term_children to authenticated;

-- Anónimo -----------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.terms', '42501', null, 'anon no puede leer trimestres');
reset role;

-- Usuaria A crea trimestres -------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.terms (id, name, year, start_date, end_date)
    values ('a1111111-0000-4000-8000-000000000001', 'Primer trimestre', 2026, '2026-01-12', '2026-04-03')$$,
  'A crea su primer trimestre sin indicar user_id ni zona'
);
select results_eq(
  $$select user_id, timezone, status::text from public.terms where id = 'a1111111-0000-4000-8000-000000000001'$$,
  $$values ('11111111-1111-4111-8111-111111111111'::uuid, 'Europe/Madrid'::text, 'active'::text)$$,
  'user_id = auth.uid(), zona del perfil y estado activo por defecto'
);
select results_eq(
  'select active_term_id, onboarded_at is not null from public.profiles',
  $$values ('a1111111-0000-4000-8000-000000000001'::uuid, true)$$,
  'el primer trimestre pasa a ser el activo y marca el onboarding'
);

select lives_ok(
  $$insert into public.terms (id, name, year, start_date, end_date, timezone)
    values ('a1111111-0000-4000-8000-000000000002', 'Segundo trimestre', 2026, '2026-04-13', '2026-07-03', 'America/Bogota')$$,
  'A crea un segundo trimestre con otra zona'
);
select is(
  (select active_term_id from public.profiles),
  'a1111111-0000-4000-8000-000000000001'::uuid,
  'crear otro trimestre no cambia el activo'
);

-- Restricciones
select throws_ok(
  $$insert into public.terms (name, year, start_date, end_date) values ('Mal', 2026, '2026-05-01', '2026-04-01')$$,
  '23514', null, 'fin anterior al inicio rechazado'
);
select throws_ok(
  $$insert into public.terms (name, year, start_date, end_date) values ('Mal', 1999, '2026-01-01', '2026-02-01')$$,
  '23514', null, 'año fuera de 2000–2100 rechazado'
);
select throws_ok(
  $$insert into public.terms (name, year, start_date, end_date, timezone) values ('Mal', 2026, '2026-01-01', '2026-02-01', 'Marte/Olimpo')$$,
  '23514', null, 'zona inexistente rechazada'
);
select throws_ok(
  $$insert into public.terms (name, year, start_date, end_date) values ('   ', 2026, '2026-01-01', '2026-02-01')$$,
  '23514', null, 'nombre vacío rechazado'
);
select throws_ok(
  $$insert into public.terms (name, year, start_date, end_date, description) values ('X', 2026, '2026-01-01', '2026-02-01', repeat('x', 1001))$$,
  '23514', null, 'descripción de más de 1000 caracteres rechazada'
);
select throws_ok(
  $$insert into public.terms (user_id, name, year, start_date, end_date)
    values ('22222222-2222-4222-8222-222222222222', 'Intruso', 2026, '2026-01-01', '2026-02-01')$$,
  '42501', null, 'A no puede crear trimestres a nombre de B'
);
select throws_ok(
  $$update public.terms set finished_at = now()$$,
  '42501', null, 'A no puede tocar las marcas de tiempo directamente'
);
select throws_ok(
  $$update public.terms set user_id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'A no puede cambiar el dueño de un trimestre'
);

-- Usuario B ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.terms (id, name, year, start_date, end_date)
    values ('b2222222-0000-4000-8000-000000000001', 'Semestre B', 2026, '2026-02-01', '2026-06-30')$$,
  'B crea su trimestre'
);
select results_eq(
  'select id from public.terms',
  $$values ('b2222222-0000-4000-8000-000000000001'::uuid)$$,
  'B solo ve sus trimestres'
);
select is_empty(
  $$select * from public.terms where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'B no puede leer un trimestre de A por id'
);
select is_empty(
  $$update public.terms set name = 'Hackeado' where id = 'a1111111-0000-4000-8000-000000000001' returning id$$,
  'B no puede editar trimestres de A (0 filas)'
);
select is_empty(
  $$delete from public.terms where id = 'a1111111-0000-4000-8000-000000000001' returning id$$,
  'B no puede borrar trimestres de A (0 filas)'
);
select throws_ok(
  $$update public.profiles set active_term_id = 'a1111111-0000-4000-8000-000000000001'$$,
  '23503', null, 'B no puede fijar como activo un trimestre de A (FK compuesta)'
);
select throws_ok(
  $$insert into public.pgtap_term_children (term_id, label) values ('a1111111-0000-4000-8000-000000000001', 'intruso')$$,
  '23503', null, 'B no puede colgar hijos de un trimestre de A (FK compuesta)'
);

-- Vuelve A: cambiar activo, ciclo de vida y solo lectura ------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select results_eq(
  $$select name from public.terms where id = 'a1111111-0000-4000-8000-000000000001'$$,
  $$values ('Primer trimestre'::text)$$,
  'el trimestre de A sigue intacto tras los intentos de B'
);
select lives_ok(
  $$update public.profiles set active_term_id = 'a1111111-0000-4000-8000-000000000002'$$,
  'A cambia su trimestre activo'
);
select is(
  (select active_term_id from public.profiles),
  'a1111111-0000-4000-8000-000000000002'::uuid,
  'el nuevo trimestre activo queda guardado'
);

select lives_ok(
  $$insert into public.pgtap_term_children (term_id, label) values ('a1111111-0000-4000-8000-000000000001', 'tarea')$$,
  'se pueden crear hijos en un trimestre no archivado'
);

select lives_ok(
  $$update public.terms set status = 'finished' where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'A finaliza un trimestre'
);
select results_eq(
  $$select finished_at is not null, archived_at is null from public.terms where id = 'a1111111-0000-4000-8000-000000000001'$$,
  $$values (true, true)$$,
  'finalizar fija finished_at'
);
select lives_ok(
  $$update public.terms set status = 'archived' where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'A archiva el trimestre finalizado'
);
select results_eq(
  $$select finished_at is not null, archived_at is not null from public.terms where id = 'a1111111-0000-4000-8000-000000000001'$$,
  $$values (true, true)$$,
  'archivar fija archived_at y conserva finished_at'
);

select throws_ok(
  $$update public.terms set name = 'Cambio' where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'P0001', 'TERM_ARCHIVED', 'un trimestre archivado no se puede editar'
);
select throws_ok(
  $$update public.terms set status = 'active' where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'P0001', 'TERM_ARCHIVED', 'archivado → activo no está permitido (primero desarchivar)'
);
select throws_ok(
  $$update public.terms set status = 'finished', name = 'Cambio' where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'P0001', 'TERM_ARCHIVED', 'desarchivar no permite cambiar otros campos a la vez'
);

-- Plantilla assert_term_writable sobre la tabla hija de ejemplo
select throws_ok(
  $$insert into public.pgtap_term_children (term_id, label) values ('a1111111-0000-4000-8000-000000000001', 'nueva')$$,
  'P0001', 'TERM_ARCHIVED', 'no se pueden crear hijos en un trimestre archivado'
);
select throws_ok(
  $$update public.pgtap_term_children set label = 'editada'$$,
  'P0001', 'TERM_ARCHIVED', 'no se pueden editar hijos de un trimestre archivado'
);
select throws_ok(
  $$delete from public.pgtap_term_children$$,
  'P0001', 'TERM_ARCHIVED', 'no se pueden borrar hijos sueltos de un trimestre archivado'
);
select throws_ok(
  $$update public.pgtap_term_children set term_id = 'a1111111-0000-4000-8000-000000000002'$$,
  'P0001', 'TERM_ARCHIVED', 'no se puede sacar un hijo de un trimestre archivado'
);

select lives_ok(
  $$update public.terms set status = 'finished' where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'A desarchiva el trimestre (archived → finished)'
);
select results_eq(
  $$select status::text, archived_at is null from public.terms where id = 'a1111111-0000-4000-8000-000000000001'$$,
  $$values ('finished'::text, true)$$,
  'desarchivar lo deja finalizado y limpia archived_at'
);
select lives_ok(
  $$update public.pgtap_term_children set label = 'editada'$$,
  'tras desarchivar, los hijos vuelven a ser editables'
);

-- Borrado: el trimestre archivado se puede eliminar y arrastra a sus hijos en cascada.
update public.terms set status = 'archived' where id = 'a1111111-0000-4000-8000-000000000001';
update public.profiles set active_term_id = 'a1111111-0000-4000-8000-000000000001';
select lives_ok(
  $$delete from public.terms where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'A puede eliminar un trimestre archivado (cascada a los hijos permitida)'
);
select is_empty('select * from public.pgtap_term_children', 'los hijos se borran en cascada');
select is(
  (select active_term_id from public.profiles),
  null,
  'eliminar el trimestre activo deja active_term_id en NULL'
);

reset role;

-- Cascada desde auth.users
delete from auth.users where id = '22222222-2222-4222-8222-222222222222';
select is_empty(
  $$select * from public.terms where user_id = '22222222-2222-4222-8222-222222222222'$$,
  'borrar el usuario borra sus trimestres'
);

select * from finish();
rollback;

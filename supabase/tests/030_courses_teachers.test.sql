-- Fase 3 · courses, teachers y course_teachers: FKs compuestas, aislamiento A ↔ B,
-- solo lectura en trimestres archivados, docente principal y cascadas (plan §8, §13, §26).
begin;
select plan(68);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'pgtap-a@orbita.test', '{"full_name":"Usuaria A"}'),
  ('22222222-2222-4222-8222-222222222222', 'pgtap-b@orbita.test', '{"full_name":"Usuario B"}');

-- Estructura --------------------------------------------------------------------------
select has_table('public', 'courses', 'existe la tabla courses');
select has_table('public', 'teachers', 'existe la tabla teachers');
select has_table('public', 'course_teachers', 'existe la tabla course_teachers');
select fk_ok(
  'public', 'courses', array['term_id', 'user_id'],
  'public', 'terms', array['id', 'user_id'],
  'courses: FK compuesta (term_id, user_id) → terms(id, user_id)'
);
select col_is_unique('public', 'courses', array['id', 'user_id'], 'courses expone UNIQUE (id, user_id)');
select col_is_unique(
  'public', 'courses', array['id', 'term_id', 'user_id'],
  'courses expone UNIQUE (id, term_id, user_id)'
);
select col_is_unique('public', 'teachers', array['id', 'user_id'], 'teachers expone UNIQUE (id, user_id)');
select fk_ok(
  'public', 'course_teachers', array['course_id', 'user_id'],
  'public', 'courses', array['id', 'user_id'],
  'course_teachers: FK compuesta hacia courses'
);
select fk_ok(
  'public', 'course_teachers', array['teacher_id', 'user_id'],
  'public', 'teachers', array['id', 'user_id'],
  'course_teachers: FK compuesta hacia teachers'
);
select col_is_pk('public', 'course_teachers', array['course_id', 'teacher_id'], 'PK (course_id, teacher_id)');
select has_index(
  'public', 'course_teachers', 'course_teachers_one_primary_idx',
  'índice único parcial del docente principal'
);
select has_trigger('public', 'courses', 'courses_set_updated_at', 'courses mantiene updated_at');
select has_trigger('public', 'teachers', 'teachers_set_updated_at', 'teachers mantiene updated_at');
select has_trigger('public', 'course_teachers', 'course_teachers_set_updated_at', 'course_teachers mantiene updated_at');
select has_trigger(
  'public', 'courses', 'courses_assert_term_writable',
  'courses usa la plantilla assert_term_writable'
);
select has_trigger(
  'public', 'course_teachers', 'course_teachers_assert_term_writable',
  'course_teachers bloquea escrituras en trimestres archivados'
);

-- Anónimo ---------------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.courses', '42501', null, 'anon no puede leer clases');
select throws_ok('select * from public.teachers', '42501', null, 'anon no puede leer docentes');
select throws_ok('select * from public.course_teachers', '42501', null, 'anon no puede leer asignaciones');
reset role;

-- Usuaria A ---------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

insert into public.terms (id, name, year, start_date, end_date) values
  ('a1111111-0000-4000-8000-000000000001', 'Trimestre A1', 2026, '2026-01-12', '2026-04-03'),
  ('a1111111-0000-4000-8000-000000000002', 'Trimestre A2', 2026, '2026-04-13', '2026-07-03');

select lives_ok(
  $$insert into public.courses (id, term_id, name, code, color, icon, room, credits)
    values ('ac000000-0000-4000-8000-000000000001', 'a1111111-0000-4000-8000-000000000001',
            'Cálculo', 'MAT-204', 'indigo', '📐', 'B-204', 4)$$,
  'A crea una clase en su trimestre sin indicar user_id'
);
select lives_ok(
  $$insert into public.courses (id, term_id, name, color)
    values ('ac000000-0000-4000-8000-000000000002', 'a1111111-0000-4000-8000-000000000001', 'Química', 'green')$$,
  'A crea una segunda clase en el mismo trimestre'
);
select lives_ok(
  $$insert into public.courses (id, term_id, name, color)
    values ('ac000000-0000-4000-8000-000000000003', 'a1111111-0000-4000-8000-000000000002', 'Física', 'blue')$$,
  'A crea una clase en otro trimestre'
);
select results_eq(
  $$select id, position, user_id from public.courses where term_id = 'a1111111-0000-4000-8000-000000000001' order by position$$,
  $$values ('ac000000-0000-4000-8000-000000000001'::uuid, 0, '11111111-1111-4111-8111-111111111111'::uuid),
           ('ac000000-0000-4000-8000-000000000002'::uuid, 1, '11111111-1111-4111-8111-111111111111'::uuid)$$,
  'position se asigna al final del trimestre y user_id = auth.uid()'
);
select is(
  (select position from public.courses where id = 'ac000000-0000-4000-8000-000000000003'),
  0,
  'el orden es independiente en cada trimestre'
);

-- Restricciones
select throws_ok(
  $$insert into public.courses (term_id, name, color) values ('a1111111-0000-4000-8000-000000000001', 'Mal', '#ff0000')$$,
  '23514', null, 'color fuera de la paleta rechazado'
);
select throws_ok(
  $$insert into public.courses (term_id, name, color) values ('a1111111-0000-4000-8000-000000000001', '  ', 'red')$$,
  '23514', null, 'nombre vacío rechazado'
);
select throws_ok(
  $$insert into public.courses (term_id, name, color, credits) values ('a1111111-0000-4000-8000-000000000001', 'Mal', 'red', -1)$$,
  '23514', null, 'créditos negativos rechazados'
);
select throws_ok(
  $$insert into public.courses (term_id, name, color, code) values ('a1111111-0000-4000-8000-000000000001', 'Mal', 'red', repeat('x', 31))$$,
  '23514', null, 'código de más de 30 caracteres rechazado'
);
select throws_ok(
  $$insert into public.courses (term_id, name, color, position) values ('a1111111-0000-4000-8000-000000000001', 'Mal', 'red', 5)$$,
  '42501', null, 'position no se puede fijar al crear'
);
select throws_ok(
  $$update public.courses set term_id = 'a1111111-0000-4000-8000-000000000002' where id = 'ac000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'una clase no se puede mover de trimestre'
);
select throws_ok(
  $$update public.courses set user_id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'A no puede cambiar el dueño de una clase'
);

-- Reordenar
select lives_ok(
  $$select public.reorder_courses('a1111111-0000-4000-8000-000000000001',
      array['ac000000-0000-4000-8000-000000000002', 'ac000000-0000-4000-8000-000000000001']::uuid[])$$,
  'A reordena las clases de un trimestre'
);
select results_eq(
  $$select id from public.courses where term_id = 'a1111111-0000-4000-8000-000000000001' order by position$$,
  $$values ('ac000000-0000-4000-8000-000000000002'::uuid), ('ac000000-0000-4000-8000-000000000001'::uuid)$$,
  'el nuevo orden queda guardado'
);

-- Docentes
select lives_ok(
  $$insert into public.teachers (id, full_name, email, phone)
    values ('a7000000-0000-4000-8000-000000000001', 'Marta Gómez', 'marta@uni.test', '+57 601 555 0101'),
           ('a7000000-0000-4000-8000-000000000002', 'Julián Rojas', null, null)$$,
  'A crea docentes'
);
select throws_ok(
  $$insert into public.teachers (full_name, email) values ('Mal', 'no-es-correo')$$,
  '23514', null, 'correo con formato inválido rechazado'
);
select throws_ok(
  $$insert into public.teachers (full_name, phone) values ('Mal', 'llámame')$$,
  '23514', null, 'teléfono con formato inválido rechazado'
);
select lives_ok(
  $$select public.set_course_primary_teacher('ac000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001')$$,
  'A asigna un docente principal a su clase'
);
select lives_ok(
  $$select public.set_course_primary_teacher('ac000000-0000-4000-8000-000000000003', 'a7000000-0000-4000-8000-000000000001')$$,
  'el mismo docente se reutiliza en una clase de otro trimestre'
);
select throws_ok(
  $$insert into public.course_teachers (course_id, teacher_id, is_primary)
    values ('ac000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000002', true)$$,
  '23505', null, 'solo un docente principal por clase'
);
select lives_ok(
  $$select public.set_course_primary_teacher('ac000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000002')$$,
  'cambiar el docente principal sustituye al anterior'
);
select results_eq(
  $$select teacher_id, is_primary from public.course_teachers where course_id = 'ac000000-0000-4000-8000-000000000001'$$,
  $$values ('a7000000-0000-4000-8000-000000000002'::uuid, true)$$,
  'la clase queda con un único docente principal'
);

-- Usuario B ---------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);

insert into public.terms (id, name, year, start_date, end_date)
values ('b2222222-0000-4000-8000-000000000001', 'Semestre B', 2026, '2026-02-01', '2026-06-30');
insert into public.courses (id, term_id, name, color)
values ('bc000000-0000-4000-8000-000000000001', 'b2222222-0000-4000-8000-000000000001', 'Arte', 'pink');
insert into public.teachers (id, full_name) values ('b7000000-0000-4000-8000-000000000001', 'Elena Ruiz');
insert into public.course_teachers (course_id, teacher_id, is_primary)
values ('bc000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$insert into public.courses (term_id, name, color) values ('a1111111-0000-4000-8000-000000000001', 'Intrusa', 'red')$$,
  '23503', null, 'B no puede crear una clase en un trimestre de A (FK compuesta)'
);
select throws_ok(
  $$insert into public.courses (user_id, term_id, name, color)
    values ('11111111-1111-4111-8111-111111111111', 'a1111111-0000-4000-8000-000000000001', 'Intrusa', 'red')$$,
  '42501', null, 'B no puede crear clases a nombre de A (RLS)'
);
select results_eq(
  'select id from public.courses',
  $$values ('bc000000-0000-4000-8000-000000000001'::uuid)$$,
  'B solo ve sus clases'
);
select is_empty('select * from public.teachers where user_id <> auth.uid()', 'B no ve los docentes de A');
select results_eq(
  'select course_id from public.course_teachers',
  $$values ('bc000000-0000-4000-8000-000000000001'::uuid)$$,
  'B solo ve sus asignaciones'
);
select is_empty(
  $$update public.courses set name = 'Hackeada' where id = 'ac000000-0000-4000-8000-000000000001' returning id$$,
  'B no puede editar clases de A (0 filas)'
);
select is_empty(
  $$delete from public.courses where id = 'ac000000-0000-4000-8000-000000000001' returning id$$,
  'B no puede borrar clases de A (0 filas)'
);
select is_empty(
  $$update public.teachers set email = 'x@y.test' where id = 'a7000000-0000-4000-8000-000000000001' returning id$$,
  'B no puede editar docentes de A (0 filas)'
);
select throws_ok(
  $$insert into public.course_teachers (course_id, teacher_id) values ('ac000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001')$$,
  '23503', null, 'B no puede asignar su docente a una clase de A'
);
select throws_ok(
  $$insert into public.course_teachers (course_id, teacher_id) values ('bc000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001')$$,
  '23503', null, 'B no puede asignar a su clase un docente de A'
);
select throws_ok(
  $$select public.set_course_primary_teacher('ac000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001')$$,
  '23503', null, 'set_course_primary_teacher no sirve para clases ajenas'
);
select lives_ok(
  $$select public.reorder_courses('a1111111-0000-4000-8000-000000000001',
      array['ac000000-0000-4000-8000-000000000001', 'ac000000-0000-4000-8000-000000000002']::uuid[])$$,
  'reorder_courses sobre un trimestre ajeno no falla…'
);

-- Vuelve A: soft delete y trimestre archivado ------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select results_eq(
  $$select id from public.courses where term_id = 'a1111111-0000-4000-8000-000000000001' order by position$$,
  $$values ('ac000000-0000-4000-8000-000000000002'::uuid), ('ac000000-0000-4000-8000-000000000001'::uuid)$$,
  '…ni cambia el orden de A'
);

select lives_ok(
  $$update public.courses set deleted_at = '2000-01-01' where id = 'ac000000-0000-4000-8000-000000000002'$$,
  'A envía una clase a la papelera'
);
select ok(
  (select deleted_at > now() - interval '1 minute' from public.courses where id = 'ac000000-0000-4000-8000-000000000002'),
  'deleted_at lo fija la BD (no el cliente)'
);

update public.terms set status = 'archived' where id = 'a1111111-0000-4000-8000-000000000001';

select throws_ok(
  $$insert into public.courses (term_id, name, color) values ('a1111111-0000-4000-8000-000000000001', 'Nueva', 'red')$$,
  'P0001', 'TERM_ARCHIVED', 'no se crean clases en un trimestre archivado'
);
select throws_ok(
  $$update public.courses set name = 'Editada' where id = 'ac000000-0000-4000-8000-000000000001'$$,
  'P0001', 'TERM_ARCHIVED', 'no se editan clases de un trimestre archivado'
);
select throws_ok(
  $$update public.courses set deleted_at = null where id = 'ac000000-0000-4000-8000-000000000002'$$,
  'P0001', 'TERM_ARCHIVED', 'no se restauran clases de un trimestre archivado'
);
select throws_ok(
  $$select public.set_course_primary_teacher('ac000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001')$$,
  'P0001', 'TERM_ARCHIVED', 'no se cambia el docente de una clase archivada'
);
select throws_ok(
  $$delete from public.course_teachers where course_id = 'ac000000-0000-4000-8000-000000000001'$$,
  'P0001', 'TERM_ARCHIVED', 'no se quita el docente de una clase archivada'
);
select throws_ok(
  $$delete from public.teachers where id = 'a7000000-0000-4000-8000-000000000002'$$,
  'P0001', 'TERM_ARCHIVED', 'no se borra un docente asignado a clases archivadas'
);
select lives_ok(
  $$update public.teachers set office = 'Bloque C' where id = 'a7000000-0000-4000-8000-000000000002'$$,
  'los datos del docente (entidad del usuario) sí se pueden editar'
);
select lives_ok(
  $$delete from public.course_teachers where course_id = 'ac000000-0000-4000-8000-000000000003'$$,
  'en trimestres no archivados se puede quitar un docente'
);

-- Cascadas: eliminar el trimestre archivado arrastra clases y asignaciones.
select lives_ok(
  $$delete from public.terms where id = 'a1111111-0000-4000-8000-000000000001'$$,
  'A elimina el trimestre archivado con sus clases'
);
select is_empty(
  $$select * from public.courses where term_id = 'a1111111-0000-4000-8000-000000000001'$$,
  'las clases del trimestre se borran en cascada (también las de la papelera)'
);
select is_empty(
  $$select * from public.course_teachers where course_id = 'ac000000-0000-4000-8000-000000000001'$$,
  'las asignaciones de docentes se borran en cascada'
);

reset role;

-- Borrar la cuenta arrastra todo su árbol, aunque tenga trimestres archivados.
update public.terms set status = 'archived' where id = 'b2222222-0000-4000-8000-000000000001';
delete from auth.users where id = '22222222-2222-4222-8222-222222222222';
select is_empty(
  $$select 1 from public.courses where user_id = '22222222-2222-4222-8222-222222222222'
    union all select 1 from public.teachers where user_id = '22222222-2222-4222-8222-222222222222'
    union all select 1 from public.course_teachers where user_id = '22222222-2222-4222-8222-222222222222'$$,
  'borrar el usuario borra sus clases y docentes'
);

select * from finish();
rollback;

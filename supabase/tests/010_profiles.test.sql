-- Fase 1 · profiles: trigger de alta, restricciones y aislamiento A ↔ B (plan §26, §29).
begin;
select plan(24);

-- Usuarios de prueba (el trigger on_auth_user_created crea sus perfiles).
insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'pgtap-a@orbita.test',
   '{"full_name":"  Usuaria A  ","timezone":"Europe/Madrid"}'),
  ('22222222-2222-4222-8222-222222222222', 'pgtap-b@orbita.test',
   '{"full_name":"Usuario B","timezone":"No/Existe"}'),
  ('33333333-3333-4333-8333-333333333333', 'sin-nombre@orbita.test', '{}');

-- Estructura -----------------------------------------------------------------
select has_table('public', 'profiles', 'existe la tabla profiles');
select has_trigger('public', 'profiles', 'profiles_set_updated_at', 'profiles mantiene updated_at');
select has_trigger('auth', 'users', 'on_auth_user_created', 'auth.users crea el perfil al registrarse');

-- Trigger de alta -------------------------------------------------------------
select results_eq(
  $$select full_name, timezone, week_starts_on::int, theme from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'$$,
  $$values ('Usuaria A'::text, 'Europe/Madrid'::text, 1, 'system'::text)$$,
  'el perfil toma nombre (recortado) y zona de los metadatos, con valores por defecto'
);
select is(
  (select timezone from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'America/Bogota',
  'una zona inválida en los metadatos cae en America/Bogota sin impedir el alta'
);
select is(
  (select full_name from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  'sin-nombre',
  'sin nombre en los metadatos se usa la parte local del correo'
);

-- Acceso anónimo ----------------------------------------------------------------
set local role anon;
select throws_ok(
  'select * from public.profiles', '42501', null, 'anon no puede leer perfiles'
);
reset role;

-- Como usuaria A ------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select results_eq(
  'select id from public.profiles',
  $$values ('11111111-1111-4111-8111-111111111111'::uuid)$$,
  'A solo ve su propio perfil'
);
select is_empty(
  $$select * from public.profiles where id = '22222222-2222-4222-8222-222222222222'$$,
  'A no puede leer el perfil de B'
);

select lives_ok(
  $$update public.profiles set full_name = 'Hackeado' where id = '22222222-2222-4222-8222-222222222222'$$,
  'actualizar el perfil de B no lanza error…'
);
select lives_ok(
  $$update public.profiles set full_name = 'Ana Actualizada', timezone = 'America/New_York',
      week_starts_on = 7, theme = 'dark'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  'A puede editar sus preferencias'
);
select results_eq(
  'select full_name, timezone, week_starts_on::int, theme from public.profiles',
  $$values ('Ana Actualizada'::text, 'America/New_York'::text, 7, 'dark'::text)$$,
  'los cambios de A quedan guardados'
);

select throws_ok(
  $$update public.profiles set id = '22222222-2222-4222-8222-222222222222'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', null, 'A no puede cambiar el id de su perfil'
);
select throws_ok(
  $$update public.profiles set onboarded_at = now()$$,
  '42501', null, 'A no puede tocar columnas no editables (onboarded_at)'
);
select throws_ok(
  $$insert into public.profiles (id, full_name) values ('22222222-2222-4222-8222-222222222222', 'x')$$,
  '42501', null, 'A no puede insertar perfiles'
);
select throws_ok(
  $$delete from public.profiles where id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'A no puede borrar perfiles (ni el de B)'
);
select throws_ok(
  $$delete from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', null, 'A no puede borrar su propio perfil directamente'
);

-- Restricciones de datos
select throws_ok(
  $$update public.profiles set timezone = 'Marte/Olimpo'$$,
  '23514', null, 'zona horaria inexistente rechazada'
);
select throws_ok(
  $$update public.profiles set timezone = 'UTC+5'$$,
  '23514', null, 'abreviatura POSIX rechazada'
);
select throws_ok(
  $$update public.profiles set week_starts_on = 8$$,
  '23514', null, 'inicio de semana fuera de 1–7 rechazado'
);
select throws_ok(
  $$update public.profiles set theme = 'sepia'$$,
  '23514', null, 'tema desconocido rechazado'
);
select throws_ok(
  $$update public.profiles set full_name = '   '$$,
  '23514', null, 'nombre vacío rechazado'
);

reset role;

select is(
  (select full_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'Usuario B',
  '…y el perfil de B sigue intacto'
);

-- Borrado en cascada desde auth.users
delete from auth.users where id = '33333333-3333-4333-8333-333333333333';
select is_empty(
  $$select * from public.profiles where id = '33333333-3333-4333-8333-333333333333'$$,
  'borrar el usuario de auth borra su perfil'
);

select * from finish();
rollback;

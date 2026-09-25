-- Datos de desarrollo (solo local; `npm run db:reset` los recrea).
-- Usuarios de prueba A y B para comprobar a mano el aislamiento entre cuentas.
--   a@orbita.test / orbita-dev-123
--   b@orbita.test / orbita-dev-123
-- El trigger on_auth_user_created crea sus perfiles.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, phone_change, phone_change_token
)
values
  (
    '00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'a@orbita.test',
    extensions.crypt('orbita-dev-123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ana Prueba","timezone":"America/Bogota"}', now(), now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated', 'b@orbita.test',
    extensions.crypt('orbita-dev-123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bruno Prueba","timezone":"Europe/Madrid"}', now(), now(),
    '', '', '', '', '', '', '', ''
  );

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email in ('a@orbita.test', 'b@orbita.test');

-- Trimestres de ejemplo (la zona se toma del perfil). El primero que se inserta de cada
-- usuario pasa a ser su trimestre activo y marca el onboarding (trigger terms_after_insert).
insert into public.terms (id, user_id, name, year, start_date, end_date, status, description)
values
  ('a0000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Segundo trimestre', 2026, '2026-07-13', '2026-10-02', 'active', null),
  ('a0000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Primer trimestre', 2026, '2026-04-06', '2026-06-26', 'finished', 'Trimestre ya cerrado.'),
  ('b0000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'Semestre de otoño', 2026, '2026-09-07', '2026-12-18', 'active', null);

-- Clases y docentes de ejemplo (Fase 3). Las del trimestre archivado se crean antes de
-- archivarlo: después es de solo lectura.
insert into public.teachers (id, user_id, full_name, email, phone, office, office_hours)
values
  ('a3000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Marta Gómez', 'marta.gomez@universidad.test', '+57 601 555 0101', 'Bloque B, 204',
   'Martes y jueves de 14:00 a 16:00'),
  ('a3000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Julián Rojas', 'julian.rojas@universidad.test', null, null, null),
  ('b3000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'Elena Ruiz', 'elena.ruiz@universidad.test', null, 'Despacho 3.12', null);

insert into public.courses (id, user_id, term_id, name, code, color, icon, room, credits)
values
  ('a2000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'a0000000-0000-4000-8000-000000000002', 'Cálculo diferencial', 'MAT-204', 'indigo', '📐',
   'B-204', 4),
  ('a2000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'a0000000-0000-4000-8000-000000000002', 'Química general', 'QUI-101', 'green', '🧪',
   'Laboratorio 3', 3),
  ('a2000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'a0000000-0000-4000-8000-000000000001', 'Introducción a la programación', 'SIS-100',
   'blue', '💻', 'Sala 5', 3),
  ('b2000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'b0000000-0000-4000-8000-000000000001', 'Historia del arte', 'ART-110', 'pink', '🎨',
   'Aula magna', 2);

insert into public.course_teachers (course_id, teacher_id, user_id, is_primary)
values
  ('a2000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true),
  ('a2000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000002',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true),
  ('b2000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);

update public.terms set status = 'archived' where id = 'a0000000-0000-4000-8000-000000000001';

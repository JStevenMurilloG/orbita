-- Fase 3 · Clases y docentes (plan §8 `courses`, `teachers`, `course_teachers`; §13; §26).
-- Árbol de propiedad: user → term → course → course_teacher ← teacher ← user.
-- Todas las relaciones usan FKs compuestas con user_id (ADR-0003): es imposible colgar una
-- clase de un trimestre ajeno o asignar a una clase un docente de otro usuario.

-- ---------------------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  term_id uuid not null,
  name text not null
    constraint courses_name_length check (char_length(btrim(name)) between 1 and 100),
  code text
    constraint courses_code_length check (char_length(btrim(code)) between 1 and 30),
  description text
    constraint courses_description_length check (char_length(description) <= 2000),
  -- Token de la paleta fija (src/lib/design/course-colors.ts), nunca un hex.
  color text not null
    constraint courses_color_token check (color in (
      'red', 'orange', 'amber', 'lime', 'green', 'teal',
      'cyan', 'blue', 'indigo', 'violet', 'pink', 'slate'
    )),
  -- Emoji opcional (📐). Un emoji con modificadores/ZWJ puede ocupar varios code points.
  icon text
    constraint courses_icon_length check (char_length(icon) between 1 and 16 and icon !~ '\s'),
  room text
    constraint courses_room_length check (char_length(btrim(room)) between 1 and 50),
  credits numeric(4, 1)
    constraint courses_credits_positive check (credits >= 0),
  -- Orden manual dentro del trimestre; al crear, el trigger la pone al final.
  position integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_term_fkey
    foreign key (term_id, user_id) references public.terms (id, user_id) on delete cascade,
  -- Destinos de las FKs compuestas de los hijos (docentes, horario, tareas…).
  constraint courses_id_user_id_key unique (id, user_id),
  constraint courses_id_term_id_user_id_key unique (id, term_id, user_id)
);

comment on table public.courses is 'Clases (materias) de un trimestre.';
comment on column public.courses.color is 'Token de la paleta de 12 colores accesibles.';
comment on column public.courses.deleted_at is 'Borrado suave: papelera de 30 días (plan §26).';

create index courses_term_position_idx on public.courses (term_id, position)
  where deleted_at is null;
-- Para la cascada desde terms (incluye las clases en la papelera).
create index courses_term_user_idx on public.courses (term_id, user_id);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- Trimestre archivado → clases de solo lectura (plantilla de la Fase 2).
create trigger courses_assert_term_writable
  before insert or update or delete on public.courses
  for each row execute function public.assert_term_writable();

-- Al crear: la clase va al final del trimestre. Al borrar/restaurar: deleted_at lo fija la BD.
create or replace function public.courses_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select coalesce(max(c.position) + 1, 0) into new.position
    from public.courses c
    where c.term_id = new.term_id and c.deleted_at is null;
    new.deleted_at := null;
    return new;
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    new.deleted_at := now();
  elsif old.deleted_at is not null and new.deleted_at is not null then
    new.deleted_at := old.deleted_at;
  end if;
  return new;
end;
$$;

create trigger courses_before_write
  before insert or update on public.courses
  for each row execute function public.courses_before_write();

alter table public.courses enable row level security;

create policy courses_select_own on public.courses
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy courses_insert_own on public.courses
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy courses_update_own on public.courses
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy courses_delete_own on public.courses
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Privilegios por columna: ni user_id ni marcas de tiempo; term_id solo al crear (una clase
-- no se mueve de trimestre); position la gestiona el trigger al crear y el reordenado después.
revoke all on public.courses from anon, authenticated;
grant select, delete on public.courses to authenticated;
grant insert (id, term_id, name, code, description, color, icon, room, credits)
  on public.courses to authenticated;
grant update (name, code, description, color, icon, room, credits, position, deleted_at)
  on public.courses to authenticated;

-- Reordenar las clases de un trimestre en una sola transacción: position = índice en el array.
-- SECURITY INVOKER: RLS y el trigger de solo lectura se aplican igual que en un UPDATE normal.
create or replace function public.reorder_courses(p_term_id uuid, p_course_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.courses c
  set position = o.ordinality - 1
  from unnest(p_course_ids) with ordinality as o (id, ordinality)
  where c.id = o.id
    and c.term_id = p_term_id
    and c.deleted_at is null
    and c.position is distinct from (o.ordinality - 1)::integer;
$$;

revoke execute on function public.reorder_courses(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_courses(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------------------
-- teachers (reutilizables entre clases y trimestres: no cuelgan de un trimestre)
-- ---------------------------------------------------------------------------------------
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name text not null
    constraint teachers_full_name_length check (char_length(btrim(full_name)) between 1 and 100),
  email text
    constraint teachers_email_format check (
      char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    ),
  phone text
    constraint teachers_phone_format check (
      phone ~ '^\+?[0-9 ().-]{3,30}$'
      and char_length(regexp_replace(phone, '\D', '', 'g')) between 3 and 20
    ),
  office text
    constraint teachers_office_length check (char_length(btrim(office)) between 1 and 100),
  -- Texto libre en el MVP (plan §39 #15).
  office_hours text
    constraint teachers_office_hours_length check (char_length(office_hours) <= 500),
  notes text
    constraint teachers_notes_length check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teachers_id_user_id_key unique (id, user_id)
);

comment on table public.teachers is 'Docentes del usuario, reutilizables entre clases y trimestres.';

create index teachers_user_name_idx on public.teachers (user_id, lower(full_name));

create trigger teachers_set_updated_at
  before update on public.teachers
  for each row execute function public.set_updated_at();

alter table public.teachers enable row level security;

create policy teachers_select_own on public.teachers
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy teachers_insert_own on public.teachers
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy teachers_update_own on public.teachers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy teachers_delete_own on public.teachers
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.teachers from anon, authenticated;
grant select, delete on public.teachers to authenticated;
grant insert (id, full_name, email, phone, office, office_hours, notes)
  on public.teachers to authenticated;
grant update (full_name, email, phone, office, office_hours, notes)
  on public.teachers to authenticated;

-- ---------------------------------------------------------------------------------------
-- course_teachers (N:M; la UI del MVP gestiona un docente principal por clase)
-- ---------------------------------------------------------------------------------------
create table public.course_teachers (
  course_id uuid not null,
  teacher_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text
    constraint course_teachers_role_length check (char_length(btrim(role)) between 1 and 40),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_teachers_pkey primary key (course_id, teacher_id),
  constraint course_teachers_course_fkey
    foreign key (course_id, user_id) references public.courses (id, user_id) on delete cascade,
  constraint course_teachers_teacher_fkey
    foreign key (teacher_id, user_id) references public.teachers (id, user_id) on delete cascade
);

comment on table public.course_teachers is 'Docentes de cada clase (titular, auxiliar, monitor…).';

-- Como mucho un docente principal por clase. Incluye user_id (la clase ya lo determina) para
-- que un intento de otro usuario sobre una clase ajena falle por la FK (23503, "no existe")
-- y no por esta unicidad, que revelaría que la clase existe y tiene docente.
create unique index course_teachers_one_primary_idx on public.course_teachers (course_id, user_id)
  where is_primary;
create index course_teachers_teacher_idx on public.course_teachers (teacher_id, user_id);
create index course_teachers_course_user_idx on public.course_teachers (course_id, user_id);

create trigger course_teachers_set_updated_at
  before update on public.course_teachers
  for each row execute function public.set_updated_at();

-- course_teachers no tiene term_id: resuelve el trimestre a través de la clase y aplica la
-- misma regla que assert_term_writable(). Los borrados en cascada (eliminar la clase, el
-- trimestre, el docente o la cuenta) se permiten; borrar un docente con clases archivadas
-- lo impide teachers_before_delete().
create or replace function public.course_teachers_assert_term_writable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and exists (
    select 1
    from public.courses c
    join public.terms t on t.id = c.term_id
    where c.id = new.course_id and t.status = 'archived'
  ) then
    raise exception using errcode = 'P0001', message = 'TERM_ARCHIVED';
  end if;

  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1
    from public.courses c
    join public.terms t on t.id = c.term_id
    where c.id = old.course_id and t.status = 'archived'
  ) then
    raise exception using errcode = 'P0001', message = 'TERM_ARCHIVED';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger course_teachers_assert_term_writable
  before insert or update or delete on public.course_teachers
  for each row execute function public.course_teachers_assert_term_writable();

-- Borrar un docente quitaría sus asignaciones en cascada, también en trimestres archivados.
-- Se impide si lo borra el usuario directamente (profundidad 1); la cascada al eliminar la
-- cuenta sí pasa.
create or replace function public.teachers_before_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_trigger_depth() = 1 and exists (
    select 1
    from public.course_teachers ct
    join public.courses c on c.id = ct.course_id
    join public.terms t on t.id = c.term_id
    where ct.teacher_id = old.id and t.status = 'archived'
  ) then
    raise exception using errcode = 'P0001', message = 'TERM_ARCHIVED',
      hint = 'El docente está asignado a clases de un trimestre archivado.';
  end if;
  return old;
end;
$$;

create trigger teachers_before_delete
  before delete on public.teachers
  for each row execute function public.teachers_before_delete();

alter table public.course_teachers enable row level security;

create policy course_teachers_select_own on public.course_teachers
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy course_teachers_insert_own on public.course_teachers
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy course_teachers_update_own on public.course_teachers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy course_teachers_delete_own on public.course_teachers
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.course_teachers from anon, authenticated;
grant select, delete on public.course_teachers to authenticated;
grant insert (course_id, teacher_id, role, is_primary) on public.course_teachers to authenticated;
grant update (role, is_primary) on public.course_teachers to authenticated;

-- Fija el docente principal de una clase en una transacción: quita al principal anterior
-- (la UI del MVP solo gestiona uno) y asigna el nuevo. SECURITY INVOKER: RLS, FKs
-- compuestas y la regla de solo lectura se aplican como en escrituras normales.
create or replace function public.set_course_primary_teacher(p_course_id uuid, p_teacher_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.course_teachers
  where course_id = p_course_id and is_primary and teacher_id <> p_teacher_id;

  insert into public.course_teachers (course_id, teacher_id, is_primary)
  values (p_course_id, p_teacher_id, true)
  on conflict (course_id, teacher_id) do update set is_primary = true;
end;
$$;

revoke execute on function public.set_course_primary_teacher(uuid, uuid) from public, anon;
grant execute on function public.set_course_primary_teacher(uuid, uuid) to authenticated;

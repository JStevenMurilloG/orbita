-- Fase 2 · Trimestres (plan §8 `terms`, §12, §26).
-- `terms` es la raíz del árbol académico: clases, horario, tareas… cuelgan de un trimestre
-- mediante FKs compuestas `(term_id, user_id) → terms(id, user_id)`.

create type public.term_status as enum ('active', 'finished', 'archived');

comment on type public.term_status is
  'Ciclo de vida: active (en curso), finished (terminado), archived (guardado, solo lectura).';

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null
    constraint terms_name_length check (char_length(btrim(name)) between 1 and 80),
  year smallint not null
    constraint terms_year_range check (year between 2000 and 2100),
  start_date date not null,
  end_date date not null,
  -- Zona de la institución; si no llega, el trigger usa la del perfil.
  timezone text not null
    constraint terms_timezone_valid check (public.is_valid_timezone(timezone)),
  status public.term_status not null default 'active',
  description text
    constraint terms_description_length check (char_length(description) <= 1000),
  finished_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint terms_dates_order check (end_date >= start_date),
  -- Marcas de tiempo coherentes con el estado (las mantiene terms_before_write).
  constraint terms_finished_at_status check ((status = 'active') = (finished_at is null)),
  constraint terms_archived_at_status check ((status = 'archived') = (archived_at is not null)),
  -- Destino de las FKs compuestas de propiedad (ADR-0003).
  constraint terms_id_user_id_key unique (id, user_id)
);

comment on table public.terms is 'Trimestres (o semestres) del usuario. Raíz de clases, horario y tareas.';
comment on column public.terms.timezone is 'Zona IANA de la institución; el horario se interpreta en ella.';

create index terms_user_status_start_idx on public.terms (user_id, status, start_date desc);

create trigger terms_set_updated_at
  before update on public.terms
  for each row execute function public.set_updated_at();

-- Reglas del ciclo de vida (plan §12):
--   active ⇄ finished → archived → finished (desarchivar).
--   Un trimestre archivado es de solo lectura: lo único permitido es desarchivarlo
--   (archived → finished) sin tocar nada más, o eliminarlo.
-- Además mantiene finished_at / archived_at y aplica la zona del perfil por defecto.
create or replace function public.terms_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.timezone is null then
      select p.timezone into new.timezone from public.profiles p where p.id = new.user_id;
    end if;
    new.finished_at := case when new.status = 'active' then null else now() end;
    new.archived_at := case when new.status = 'archived' then now() else null end;
    return new;
  end if;

  if old.status = 'archived' then
    if new.status is distinct from 'finished'
       or (new.name, new.year, new.start_date, new.end_date, new.timezone, new.description)
          is distinct from
          (old.name, old.year, old.start_date, old.end_date, old.timezone, old.description) then
      raise exception using errcode = 'P0001', message = 'TERM_ARCHIVED',
        hint = 'Desarchiva el trimestre antes de editarlo.';
    end if;
  end if;

  if new.status is distinct from old.status then
    case new.status
      when 'active' then
        new.finished_at := null;
        new.archived_at := null;
      when 'finished' then
        new.finished_at := coalesce(old.finished_at, now());
        new.archived_at := null;
      when 'archived' then
        new.finished_at := coalesce(old.finished_at, now());
        new.archived_at := now();
    end case;
  else
    new.finished_at := old.finished_at;
    new.archived_at := old.archived_at;
  end if;

  return new;
end;
$$;

create trigger terms_before_write
  before insert or update on public.terms
  for each row execute function public.terms_before_write();

-- RLS (plan §26): cada usuario solo ve y toca sus trimestres.
alter table public.terms enable row level security;

create policy terms_select_own on public.terms
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy terms_insert_own on public.terms
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy terms_update_own on public.terms
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy terms_delete_own on public.terms
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Privilegios por columna: user_id y las marcas de tiempo nunca los fija el cliente; el id
-- se puede proponer al crear (UUID generado en cliente) pero no cambiar después.
revoke all on public.terms from anon, authenticated;
grant select, delete on public.terms to authenticated;
grant insert (id, name, year, start_date, end_date, timezone, status, description)
  on public.terms to authenticated;
grant update (name, year, start_date, end_date, timezone, status, description)
  on public.terms to authenticated;

-- Trimestre activo del usuario (selección de contexto, distinta de `status`).
-- La FK compuesta impide apuntar a un trimestre ajeno; al borrar el trimestre solo se
-- anula active_term_id (no el id del perfil).
alter table public.profiles
  add column active_term_id uuid,
  add constraint profiles_active_term_fkey
    foreign key (active_term_id, id) references public.terms (id, user_id)
    on delete set null (active_term_id);

create index profiles_active_term_idx on public.profiles (active_term_id)
  where active_term_id is not null;

grant update (active_term_id) on public.profiles to authenticated;

-- Al crear un trimestre: si el usuario no tiene trimestre activo, este pasa a serlo
-- (el primero siempre), y se marca el onboarding como completado.
-- SECURITY DEFINER porque onboarded_at no es editable por el cliente; solo toca el perfil
-- del dueño del trimestre recién insertado (RLS ya validó que es auth.uid()).
create or replace function public.terms_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set active_term_id = coalesce(active_term_id, new.id),
      onboarded_at = coalesce(onboarded_at, now())
  where id = new.user_id;
  return new;
end;
$$;

revoke execute on function public.terms_after_insert() from public, anon, authenticated;

create trigger terms_after_insert
  after insert on public.terms
  for each row execute function public.terms_after_insert();

-- Plantilla de solo lectura para las tablas hijas (plan §12): toda tabla con `term_id`
-- añade
--   create trigger <tabla>_assert_term_writable
--     before insert or update or delete on public.<tabla>
--     for each row execute function public.assert_term_writable();
-- y cualquier escritura sobre un trimestre archivado falla con TERM_ARCHIVED (409).
-- Los borrados en cascada (pg_trigger_depth() > 1: eliminar el trimestre o la cuenta)
-- se permiten; lo que se bloquea es borrar hijos sueltos de un trimestre archivado.
create or replace function public.assert_term_writable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and exists (
    select 1 from public.terms t where t.id = new.term_id and t.status = 'archived'
  ) then
    raise exception using errcode = 'P0001', message = 'TERM_ARCHIVED';
  end if;

  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1 from public.terms t where t.id = old.term_id and t.status = 'archived'
  ) then
    raise exception using errcode = 'P0001', message = 'TERM_ARCHIVED';
  end if;

  return coalesce(new, old);
end;
$$;

comment on function public.assert_term_writable() is
  'Trigger para tablas hijas con term_id: bloquea escrituras si el trimestre está archivado (TERM_ARCHIVED).';

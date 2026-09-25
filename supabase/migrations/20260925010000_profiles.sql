-- Fase 1 · Perfiles de usuario (plan §8 `profiles`, §11, §26).
-- 1:1 con auth.users; se crea por trigger al registrarse. `active_term_id` llega en la Fase 2.

-- ¿Es una zona IANA conocida por Postgres? (rechaza abreviaturas POSIX como 'UTC+5').
create or replace function public.is_valid_timezone(tz text)
returns boolean
language sql
stable
parallel safe
set search_path = ''
as $$
  select tz is not null and exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

comment on function public.is_valid_timezone(text) is
  'true si tz es un nombre de zona de pg_timezone_names.';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null
    constraint profiles_full_name_length check (char_length(btrim(full_name)) between 1 and 100),
  timezone text not null default 'America/Bogota'
    constraint profiles_timezone_valid check (public.is_valid_timezone(timezone)),
  week_starts_on smallint not null default 1
    constraint profiles_week_starts_on_range check (week_starts_on between 1 and 7),
  theme text not null default 'system'
    constraint profiles_theme_valid check (theme in ('light', 'dark', 'system')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos de cuenta y preferencias (1:1 con auth.users).';
comment on column public.profiles.week_starts_on is '1 = lunes … 7 = domingo (ISO).';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS (plan §26): leer y editar solo el propio perfil. Sin INSERT/DELETE para clientes:
-- el trigger lo crea y el borrado llega en cascada desde auth.users.
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Privilegios por columna: el cliente solo puede cambiar las preferencias editables.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, timezone, week_starts_on, theme) on public.profiles to authenticated;

-- Crea el perfil al registrarse. Lee nombre y zona de raw_user_meta_data (enviados por el
-- formulario de registro) y aplica valores por defecto si faltan o no son válidos:
-- un metadato malformado nunca debe impedir el alta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100);
  v_tz text := new.raw_user_meta_data ->> 'timezone';
begin
  if v_name = '' then
    v_name := left(coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Estudiante'), 100);
  end if;

  if not public.is_valid_timezone(v_tz) then
    v_tz := 'America/Bogota';
  end if;

  insert into public.profiles (id, full_name, timezone)
  values (new.id, v_name, v_tz);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

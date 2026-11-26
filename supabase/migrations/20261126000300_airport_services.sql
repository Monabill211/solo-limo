begin;
-- On an older database, run and commit this statement on its own before running this file:
-- ALTER TYPE public.booking_type ADD VALUE IF NOT EXISTS 'airport';
-- The base schema already includes that value on a fresh install.

create table if not exists public.airport_services (
  id uuid primary key default gen_random_uuid(),
  icon text not null default '✈️',
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  features_ar text,
  features_en text,
  price_egp numeric(12,2) not null check (price_egp >= 0),
  price_usd numeric(12,2) not null check (price_usd >= 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.airport_services add column if not exists featured boolean not null default false;

alter table public.bookings
  add column if not exists airport_service_id uuid,
  add column if not exists flight_number text,
  add column if not exists service_time time,
  add column if not exists passengers integer check (passengers between 1 and 20);

alter table public.costs add column if not exists airport_service_id uuid;

-- Normalize existing airport foreign keys, including legacy ones with a different name.
do $$
declare
  target record;
  foreign_key record;
  has_expected_key boolean;
begin
  for target in select * from (values
    ('bookings', 'r', 'restrict'),
    ('costs', 'c', 'cascade')
  ) as fk(table_name, delete_code, delete_action)
  loop
    has_expected_key := false;
    for foreign_key in
      select c.conname, c.confdeltype, c.confrelid, c.confkey
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and c.conkey = array[a.attnum]
      where c.conrelid = format('public.%I', target.table_name)::regclass
        and c.contype = 'f' and a.attname = 'airport_service_id'
    loop
      if foreign_key.confdeltype::text = target.delete_code
        and foreign_key.confrelid = 'public.airport_services'::regclass
        and foreign_key.confkey = array[(select attnum from pg_attribute
          where attrelid = 'public.airport_services'::regclass and attname = 'id')]
      then
        has_expected_key := true;
      else
        execute format('alter table public.%I drop constraint %I', target.table_name, foreign_key.conname);
      end if;
    end loop;
    if not has_expected_key then
      execute format('alter table public.%I add constraint %I foreign key (airport_service_id) references public.airport_services(id) on delete %s',
        target.table_name, target.table_name || '_airport_service_id_fkey', target.delete_action);
    end if;
  end loop;
end
$$;

-- Older projects can have a differently named three-item check.
do $$
declare
  old_constraint record;
begin
  for old_constraint in
    select conname from pg_constraint
    where conrelid = 'public.costs'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%num_nonnulls(%'
      and pg_get_constraintdef(oid) like '%car_id%'
      and pg_get_constraintdef(oid) like '%apartment_id%'
      and pg_get_constraintdef(oid) like '%extra_id%'
      and pg_get_constraintdef(oid) not like '%airport_service_id%'
  loop
    execute format('alter table public.costs drop constraint %I', old_constraint.conname);
  end loop;
end
$$;

alter table public.costs drop constraint if exists costs_one_item;
alter table public.costs add constraint costs_one_item
  check (num_nonnulls(car_id, apartment_id, extra_id, airport_service_id) = 1);

create unique index if not exists solo_limo_cost_by_airport_service on public.costs (airport_service_id);
create index if not exists solo_limo_booking_by_airport_service on public.bookings (airport_service_id);

alter table public.airport_services enable row level security;
grant select on public.airport_services to anon;
grant select, insert, update, delete on public.airport_services to authenticated, service_role;

drop policy if exists solo_limo_admin_crud on public.airport_services;
create policy solo_limo_admin_crud on public.airport_services
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists solo_limo_public_active on public.airport_services;
create policy solo_limo_public_active on public.airport_services
  for select to anon, authenticated using (active);

-- Restrictive policies keep older permissive policies from exposing hidden services or allowing writes.
drop policy if exists solo_limo_airport_anon_guard on public.airport_services;
create policy solo_limo_airport_anon_guard on public.airport_services as restrictive
  for all to anon using (active) with check (false);
revoke insert, update, delete on public.airport_services from anon, public;

drop policy if exists solo_limo_airport_read_guard on public.airport_services;
create policy solo_limo_airport_read_guard on public.airport_services as restrictive
  for select to authenticated using (active or (select public.is_admin()));
drop policy if exists solo_limo_airport_insert_guard on public.airport_services;
create policy solo_limo_airport_insert_guard on public.airport_services as restrictive
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists solo_limo_airport_update_guard on public.airport_services;
create policy solo_limo_airport_update_guard on public.airport_services as restrictive
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists solo_limo_airport_delete_guard on public.airport_services;
create policy solo_limo_airport_delete_guard on public.airport_services as restrictive
  for delete to authenticated using ((select public.is_admin()));

alter table public.costs enable row level security;
grant select, insert, update, delete on public.costs to authenticated, service_role;
drop policy if exists solo_limo_airport_cost_admin on public.costs;
create policy solo_limo_airport_cost_admin on public.costs
  for all to authenticated using (airport_service_id is not null and (select public.is_admin()))
  with check (airport_service_id is not null and (select public.is_admin()));
drop policy if exists solo_limo_airport_cost_guard on public.costs;
create policy solo_limo_airport_cost_guard on public.costs as restrictive
  for all to authenticated using (airport_service_id is null or (select public.is_admin()))
  with check (airport_service_id is null or (select public.is_admin()));
drop policy if exists solo_limo_airport_cost_anon_guard on public.costs;
create policy solo_limo_airport_cost_anon_guard on public.costs as restrictive
  for all to anon using (airport_service_id is null) with check (airport_service_id is null);

notify pgrst, 'reload schema';
commit;

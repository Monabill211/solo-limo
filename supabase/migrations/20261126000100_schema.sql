begin;

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions, pg_catalog;

create type public.user_role as enum ('customer', 'admin');
create type public.booking_type as enum ('car', 'apartment', 'airport');
create type public.booking_status as enum ('pending', 'paid', 'cancelled');
create type public.currency_code as enum ('EGP', 'USD');
create type public.discount_type as enum ('percent', 'fixed');
create type public.payment_status as enum ('pending', 'success', 'failed', 'refunded');

create function public.generate_customer_code()
returns text language sql volatile set search_path = ''
as $$
  select 'SL-' || upper(replace(gen_random_uuid()::text, '-', ''));
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  customer_code text not null unique default public.generate_customer_code(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  brand text,
  model text,
  year integer,
  seats integer check (seats > 0),
  images text[] not null default '{}',
  price_egp numeric(12,2) not null check (price_egp >= 0),
  price_usd numeric(12,2) not null check (price_usd >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.apartments (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  location_ar text,
  location_en text,
  bedrooms integer check (bedrooms >= 0),
  max_guests integer check (max_guests > 0),
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  price_egp numeric(12,2) not null check (price_egp >= 0),
  price_usd numeric(12,2) not null check (price_usd >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.airport_services (
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

create table public.extras (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  applies_to public.booking_type,
  price_egp numeric(12,2) not null check (price_egp >= 0),
  price_usd numeric(12,2) not null check (price_usd >= 0),
  per_day boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.costs (
  id uuid primary key default gen_random_uuid(),
  car_id uuid references public.cars(id) on delete cascade,
  apartment_id uuid references public.apartments(id) on delete cascade,
  airport_service_id uuid references public.airport_services(id) on delete cascade,
  extra_id uuid references public.extras(id) on delete cascade,
  cost_egp numeric(12,2) not null check (cost_egp >= 0),
  updated_at timestamptz not null default now(),
  constraint costs_one_item check (num_nonnulls(car_id, apartment_id, airport_service_id, extra_id) = 1)
);

-- Full unique indexes work both for PostgREST upserts and embedded relationships.
create unique index if not exists solo_limo_cost_by_car on public.costs (car_id);
create unique index if not exists solo_limo_cost_by_apartment on public.costs (apartment_id);
create unique index if not exists solo_limo_cost_by_airport_service on public.costs (airport_service_id);
create unique index if not exists solo_limo_cost_by_extra on public.costs (extra_id);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type public.discount_type not null,
  value numeric(12,2) not null check (value > 0 and (type <> 'percent' or value <= 100)),
  customer_id uuid references public.profiles(id) on delete cascade,
  expires_at timestamptz,
  max_uses integer check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0 and (max_uses is null or used_count <= max_uses)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  booking_type public.booking_type not null,
  car_id uuid references public.cars(id) on delete restrict,
  apartment_id uuid references public.apartments(id) on delete restrict,
  airport_service_id uuid references public.airport_services(id) on delete restrict,
  item_name_ar text,
  item_name_en text,
  start_date date not null,
  end_date date not null,
  days integer generated always as (end_date - start_date) stored,
  flight_number text,
  service_time time,
  passengers integer check (passengers between 1 and 20),
  customer_name text,
  customer_phone text,
  notes text,
  currency public.currency_code not null default 'EGP',
  exchange_rate numeric(14,6) not null default 1 check (exchange_rate > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  extras_total numeric(16,2) not null default 0 check (extras_total >= 0),
  discount_code_id uuid references public.discount_codes(id) on delete set null,
  discount_amount numeric(16,2) not null default 0 check (discount_amount >= 0),
  total numeric(16,2) not null check (total >= 0),
  total_egp numeric generated always as (round(total * case when currency = 'USD' then exchange_rate else 1 end, 2)) stored,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_dates_ordered check (end_date - start_date between 1 and 90 and (booking_type <> 'airport' or end_date - start_date = 1)),
  constraint booking_item_matches_type check (
    num_nonnulls(car_id, apartment_id, airport_service_id) = 1
    and case booking_type
      when 'car' then car_id is not null
      when 'apartment' then apartment_id is not null
      when 'airport' then airport_service_id is not null
    end
  ),
  constraint booking_car_no_overlap exclude using gist
    (car_id with =, daterange(start_date, end_date, '[)') with &&)
    where (car_id is not null and status in ('pending', 'paid')),
  constraint booking_apartment_no_overlap exclude using gist
    (apartment_id with =, daterange(start_date, end_date, '[)') with &&)
    where (apartment_id is not null and status in ('pending', 'paid'))
);

create table public.booking_extras (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  extra_id uuid not null references public.extras(id) on delete restrict,
  name_ar text,
  name_en text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  unique (booking_id, extra_id)
);

create table public.booking_finance (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  unit_cost_egp numeric(12,2) not null default 0 check (unit_cost_egp >= 0),
  extras_cost_egp numeric(16,2) not null default 0 check (extras_cost_egp >= 0),
  total_cost_egp numeric(16,2) not null default 0 check (total_cost_egp >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'paymob',
  provider_order_id text,
  provider_txn_id text,
  amount numeric(16,2) not null check (amount >= 0),
  currency public.currency_code not null,
  status public.payment_status not null default 'pending',
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_order_id),
  unique (provider, provider_txn_id)
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  constraint settings_valid_usd_rate check (key <> 'usd_egp_rate' or case
    when jsonb_typeof(value) = 'number' then value::numeric between 0.000001 and 99999999.999999
    else false end)
);

insert into public.settings (key, value) values ('usd_egp_rate', '50'::jsonb)
on conflict (key) do nothing;

create index if not exists solo_limo_bookings_by_customer on public.bookings (user_id, created_at desc);
create index if not exists solo_limo_bookings_by_status on public.bookings (status, created_at desc);
create index if not exists solo_limo_discounts_by_customer on public.discount_codes (customer_id);
create index if not exists solo_limo_payments_by_booking on public.payments (booking_id);

-- Definer ownership intentionally bypasses profiles RLS. The caller can only
-- check their own role because the function gets the ID from auth.uid().
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
alter function public.is_admin() owner to postgres;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Keep customers from writing their own role, code or identity through UPDATE.
create or replace function public.solo_limo_protect_profile()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if current_user = 'authenticated' and not public.is_admin()
    and (to_jsonb(new) - 'full_name' - 'phone' - 'updated_at')
      is distinct from (to_jsonb(old) - 'full_name' - 'phone' - 'updated_at') then
    raise exception 'Only administrators may change protected profile fields' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists solo_limo_protect_profile on public.profiles;
create trigger solo_limo_protect_profile before update on public.profiles
for each row execute function public.solo_limo_protect_profile();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    'customer'
  ) on conflict (id) do nothing;
  return new;
end;
$$;
alter function public.handle_new_user() owner to postgres;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, phone, role)
select id, nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
  nullif(btrim(raw_user_meta_data ->> 'phone'), ''), 'customer'
from auth.users
on conflict (id) do nothing;

-- Expose only occupied date ranges, without customer or booking information.
create or replace function public.busy_ranges(p_type public.booking_type, p_id uuid)
returns table (start_date date, end_date date)
language sql stable security definer set search_path = ''
as $$
  select b.start_date, b.end_date
  from public.bookings b
  where b.booking_type = p_type and b.status in ('pending', 'paid')
    and (
      (p_type = 'car' and b.car_id = p_id and exists (
        select 1 from public.cars c where c.id = p_id and c.active
      )) or
      (p_type = 'apartment' and b.apartment_id = p_id and exists (
        select 1 from public.apartments a where a.id = p_id and a.active
      ))
    )
  order by b.start_date, b.end_date;
$$;
alter function public.busy_ranges(public.booking_type, uuid) owner to postgres;
revoke all on function public.busy_ranges(public.booking_type, uuid) from public;
grant execute on function public.busy_ranges(public.booking_type, uuid) to anon, authenticated, service_role;

-- Grant access only through the new app policies.
do $$
declare
  item text;
begin
  foreach item in array array[
    'profiles', 'cars', 'apartments', 'airport_services', 'extras', 'costs',
    'discount_codes', 'bookings', 'booking_extras', 'booking_finance', 'payments', 'settings'
  ] loop
    execute format('alter table public.%I enable row level security', item);
    execute format('revoke all on public.%I from public, anon, authenticated', item);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', item);
    execute format(
      'create policy solo_limo_admin_crud on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      item
    );
  end loop;
  foreach item in array array['cars', 'apartments', 'airport_services', 'extras'] loop
    execute format('grant select on public.%I to anon', item);
    execute format('create policy solo_limo_public_active on public.%I for select to anon, authenticated using (active)', item);
  end loop;
end;
$$;

create policy solo_limo_read_own_profile on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy solo_limo_update_own_profile on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy solo_limo_read_own_bookings on public.bookings
for select to authenticated using (user_id = (select auth.uid()));

create policy solo_limo_customer_read_own_booking_extras on public.booking_extras
for select to authenticated using (
  not (select public.is_admin()) and exists (
    select 1 from public.bookings b
    where b.id = booking_extras.booking_id and b.user_id = (select auth.uid())
  )
);

create policy solo_limo_read_own_discounts on public.discount_codes
for select to authenticated using (customer_id = (select auth.uid()));

-- Public URL reads use the bucket's public flag. Storage API listing and
-- writes are available to admins. The restrictive policy prevents an older
-- permissive policy from giving customers write access to this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists solo_limo_images_bucket_admin on storage.buckets;
create policy solo_limo_images_bucket_admin on storage.buckets
for all to authenticated
using (id = 'images' and (select public.is_admin()))
with check (id = 'images' and (select public.is_admin()));

drop policy if exists solo_limo_images_bucket_authenticated_guard on storage.buckets;
create policy solo_limo_images_bucket_authenticated_guard on storage.buckets as restrictive
for all to authenticated
using (id <> 'images' or (select public.is_admin()))
with check (id <> 'images' or (select public.is_admin()));

drop policy if exists solo_limo_images_bucket_anon_guard on storage.buckets;
create policy solo_limo_images_bucket_anon_guard on storage.buckets as restrictive
for all to anon using (id <> 'images') with check (id <> 'images');

drop policy if exists solo_limo_images_admin on storage.objects;
create policy solo_limo_images_admin on storage.objects
for all to authenticated
using (bucket_id = 'images' and (select public.is_admin()))
with check (bucket_id = 'images' and (select public.is_admin()));

drop policy if exists solo_limo_images_authenticated_guard on storage.objects;
create policy solo_limo_images_authenticated_guard on storage.objects as restrictive
for all to authenticated
using (bucket_id <> 'images' or (select public.is_admin()))
with check (bucket_id <> 'images' or (select public.is_admin()));

drop policy if exists solo_limo_images_anon_guard on storage.objects;
create policy solo_limo_images_anon_guard on storage.objects as restrictive
for all to anon using (bucket_id <> 'images') with check (bucket_id <> 'images');

notify pgrst, 'reload schema';
commit;

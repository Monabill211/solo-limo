-- One-time cutover for the audited Solo Limo project. Run the generated script, not this prelude.
-- Deletes the five verified Auth accounts and all data in the twelve named application tables.
-- Stops if identities, row counts, or dependencies have changed since the audit.

lock table auth.users, public.bookings, public.booking_extras, public.booking_finance,
  public.payments, public.discount_codes, public.costs, public.extras, public.airport_services,
  public.apartments, public.cars, public.profiles, public.settings in access exclusive mode;
lock table storage.buckets, storage.objects in share row exclusive mode;

do $$
declare
  candidate text;
  row_count bigint;
begin
  if (select count(*) from auth.users) <> 5 or
    (select md5(string_agg(id::text, ',' order by id::text collate "C")) from auth.users)
      is distinct from '466bc60ee8e969f65ca1d8bb2fce221a' then
    raise exception 'Auth accounts differ from audited Solo Limo project; reset stopped';
  end if;
  if (select count(*) from public.profiles) <> 5
    or (select count(*) from public.settings) <> 1
    or not exists (select 1 from storage.buckets where id = 'images') then
    raise exception 'Profile, settings or bucket inventory has changed; reset stopped';
  end if;
  foreach candidate in array array[
    'bookings','booking_extras','booking_finance','payments','discount_codes','costs',
    'extras','airport_services','apartments','cars'
  ] loop
    execute format('select count(*) from public.%I', candidate) into row_count;
    if row_count <> 0 then raise exception 'New data in %, reset stopped', candidate; end if;
  end loop;
  if exists (select 1 from storage.objects where bucket_id = 'images')
    or exists (
      select 1 from storage.objects o join auth.users u
      on u.id::text in (to_jsonb(o)->>'owner_id', to_jsonb(o)->>'owner')
    ) or exists (
      select 1 from storage.buckets b join auth.users u
      on u.id::text in (to_jsonb(b)->>'owner_id', to_jsonb(b)->>'owner')
    ) then
    raise exception 'Storage files may be affected; reset stopped';
  end if;
  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.contype = 'f' and c.confrelid = 'auth.users'::regclass
      and n.nspname <> 'auth'
      and c.conrelid <> 'public.profiles'::regclass
      and not (n.nspname = 'storage' and t.relname in ('objects', 'buckets')
        and cardinality(c.conkey) = 1 and exists (
          select 1 from pg_attribute a where a.attrelid = t.oid
            and a.attnum = any(c.conkey) and a.attname in ('owner', 'owner_id')
        ))
  ) then
    raise exception 'An unaudited table references Auth users; reset stopped';
  end if;
  if exists (
    select 1 from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal
      and (n.nspname = 'public' or t.tgname in ('on_auth_user_created','zzzz_solo_limo_create_profile'))
      and (n.nspname, t.tgname, p.proname) not in (
        ('public','on_auth_user_created','handle_new_user'),
        ('public','zzzz_solo_limo_create_profile','solo_limo_create_profile')
      )
  ) then
    raise exception 'An unaudited Auth trigger exists; reset stopped';
  end if;
end;
$$;

drop policy if exists solo_limo_images_bucket_admin on storage.buckets;
drop policy if exists solo_limo_images_bucket_authenticated_guard on storage.buckets;
drop policy if exists solo_limo_images_bucket_anon_guard on storage.buckets;
drop policy if exists solo_limo_images_admin on storage.objects;
drop policy if exists solo_limo_images_authenticated_guard on storage.objects;
drop policy if exists solo_limo_images_anon_guard on storage.objects;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists zzzz_solo_limo_create_profile on auth.users;

-- Explicit list and RESTRICT prevent cascading into unrelated tables or views.
drop table public.bookings, public.booking_extras, public.booking_finance, public.payments,
  public.discount_codes, public.costs, public.extras, public.airport_services,
  public.apartments, public.cars, public.profiles, public.settings restrict;

drop function if exists public.busy_ranges(public.booking_type, uuid) restrict;
drop function if exists public.handle_new_user() restrict;
drop function if exists public.solo_limo_create_profile() restrict;
drop function if exists public.solo_limo_prepare_customer_booking() restrict;
drop function if exists public.solo_limo_protect_profile() restrict;
drop function if exists public.generate_customer_code() restrict;
drop function if exists public.is_admin() restrict;

drop type public.user_role, public.booking_type, public.booking_status, public.currency_code,
  public.discount_type, public.payment_status restrict;

delete from auth.users;

begin;

-- Each pending or paid booking reserves one use. Cancellation or deletion releases it.
create function public.reserve_booking_discount()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  previous_id uuid;
  next_id uuid;
begin
  if tg_op <> 'INSERT' and old.status <> 'cancelled' then previous_id := old.discount_code_id; end if;
  if tg_op <> 'DELETE' and new.status <> 'cancelled' then next_id := new.discount_code_id; end if;
  if previous_id is distinct from next_id then
    perform 1 from public.discount_codes where id in (previous_id, next_id) order by id for update;
    if previous_id is not null then
      update public.discount_codes set used_count = greatest(used_count - 1, 0) where id = previous_id;
    end if;
    if next_id is not null then
      update public.discount_codes set used_count = used_count + 1
      where id = next_id and (max_uses is null or used_count < max_uses);
      if not found then raise exception 'discount_used_up'; end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.reserve_booking_discount() from public, anon, authenticated;
create trigger reserve_booking_discount before insert or update or delete on public.bookings
for each row execute function public.reserve_booking_discount();

create function public.create_booking(
  p_user_id uuid, p_type public.booking_type, p_item_id uuid,
  p_currency public.currency_code, p_start date, p_end date,
  p_name text, p_phone text, p_notes text, p_flight text, p_time time,
  p_passengers integer, p_extras uuid[], p_code text
)
returns table (booking_id uuid, total numeric, item_name text, paid boolean)
language plpgsql set search_path = ''
as $$
declare
  item record;
  extra record;
  promo public.discount_codes%rowtype;
  days integer := p_end - p_start;
  rate numeric := 1;
  unit_price numeric;
  unit_cost numeric;
  extras_total numeric := 0;
  extras_cost numeric := 0;
  extra_price numeric;
  discount numeric := 0;
  subtotal numeric;
  extras_count integer := 0;
begin
  if p_start is null or p_end is null or days not between 1 and 90 then raise exception 'bad_dates'; end if;
  if p_start < (now() at time zone 'Africa/Cairo')::date then raise exception 'past_date'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 2 and 120
    or length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) < 8
    or length(coalesce(p_phone, '')) > 30 then raise exception 'bad_contact'; end if;

  case p_type
    when 'car' then
      select c.name_ar, c.name_en, c.price_egp, c.price_usd, coalesce(s.cost_egp, 0) as cost
      into item from public.cars c left join public.costs s on s.car_id = c.id
      where c.id = p_item_id and c.active for share of c;
    when 'apartment' then
      select a.name_ar, a.name_en, a.price_egp, a.price_usd, coalesce(s.cost_egp, 0) as cost
      into item from public.apartments a left join public.costs s on s.apartment_id = a.id
      where a.id = p_item_id and a.active for share of a;
    when 'airport' then
      if days <> 1 then raise exception 'bad_dates'; end if;
      if length(btrim(coalesce(p_flight, ''))) not between 2 and 20 then raise exception 'bad_flight'; end if;
      if p_time is null then raise exception 'bad_time'; end if;
      if p_passengers is null or p_passengers not between 1 and 20 then raise exception 'bad_passengers'; end if;
      select a.name_ar, a.name_en, a.price_egp, a.price_usd, coalesce(s.cost_egp, 0) as cost
      into item from public.airport_services a left join public.costs s on s.airport_service_id = a.id
      where a.id = p_item_id and a.active for share of a;
  end case;
  if item.name_ar is null then raise exception 'not_found'; end if;

  if p_currency = 'USD' then
    select case when jsonb_typeof(s.value) = 'number' then s.value::numeric end
    into rate from public.settings s where s.key = 'usd_egp_rate';
    if rate is null or rate <= 0 then raise exception 'booking_failed'; end if;
    rate := round(rate, 6);
  end if;
  unit_price := case when p_currency = 'USD' then item.price_usd else item.price_egp end;
  unit_cost := item.cost;

  -- Hold the selected extras stable through the detail inserts.
  if coalesce(cardinality(p_extras), 0) > 50 then raise exception 'bad_extras'; end if;
  for extra in
    select e.*, coalesce(c.cost_egp, 0) as cost
    from public.extras e left join public.costs c on c.extra_id = e.id
    where e.id = any(p_extras) and e.active and (e.applies_to is null or e.applies_to = p_type)
    order by e.id for share of e
  loop
    extra_price := case when p_currency = 'USD' then extra.price_usd else extra.price_egp end;
    extras_total := extras_total + extra_price * case when extra.per_day then days else 1 end;
    extras_cost := extras_cost + extra.cost * case when extra.per_day then days else 1 end;
    extras_count := extras_count + 1;
  end loop;
  if extras_count <> coalesce(cardinality(p_extras), 0) then raise exception 'bad_extras'; end if;
  subtotal := unit_price * days + extras_total;

  if nullif(btrim(p_code), '') is not null then
    select * into promo from public.discount_codes where code = upper(btrim(p_code)) for update;
    if not found then raise exception 'discount_invalid'; end if;
    if not promo.active then raise exception 'discount_inactive'; end if;
    if promo.expires_at <= now() then raise exception 'discount_expired'; end if;
    if promo.customer_id is not null and promo.customer_id <> p_user_id then raise exception 'discount_not_yours'; end if;
    if promo.max_uses is not null and promo.used_count >= promo.max_uses then raise exception 'discount_used_up'; end if;
    discount := round(least(subtotal, case
      when promo.type = 'percent' then subtotal * promo.value / 100
      else promo.value / rate end), 2);
  end if;
  total := subtotal - discount;
  paid := total = 0;
  item_name := item.name_ar;

  insert into public.bookings as b (
    user_id, booking_type, car_id, apartment_id, airport_service_id, item_name_ar, item_name_en, start_date, end_date,
    customer_name, customer_phone, notes, flight_number, service_time, passengers,
    currency, exchange_rate, unit_price, extras_total, discount_code_id, discount_amount, total, status
  ) values (
    p_user_id, p_type, case when p_type = 'car' then p_item_id end,
    case when p_type = 'apartment' then p_item_id end, case when p_type = 'airport' then p_item_id end,
    item.name_ar, item.name_en, p_start, p_end, p_name, p_phone, nullif(left(p_notes, 500), ''),
    p_flight, p_time, p_passengers, p_currency, rate, unit_price, extras_total,
    promo.id, discount, total, case when paid then 'paid'::public.booking_status else 'pending'::public.booking_status end
  ) returning b.id into booking_id;

  insert into public.booking_extras(booking_id, extra_id, name_ar, name_en, unit_price)
  select booking_id, e.id, e.name_ar, e.name_en, case when p_currency = 'USD' then e.price_usd else e.price_egp end
  from public.extras e where e.id = any(p_extras);

  insert into public.booking_finance(booking_id, unit_cost_egp, extras_cost_egp, total_cost_egp)
  values (booking_id, unit_cost, extras_cost, unit_cost * days + extras_cost);

  return next;
end;
$$;
revoke all on function public.create_booking(uuid, public.booking_type, uuid, public.currency_code, date, date, text, text, text, text, time, integer, uuid[], text) from public, anon, authenticated;
grant execute on function public.create_booking(uuid, public.booking_type, uuid, public.currency_code, date, date, text, text, text, text, time, integer, uuid[], text) to service_role;

-- The API verifies the Paymob signature before calling this service-only function.
create function public.apply_paymob_result(
  p_order_id text, p_transaction_id text, p_currency text, p_amount_cents bigint, p_success boolean, p_payload jsonb
)
returns void language plpgsql set search_path = ''
as $$
declare
  target_id uuid;
  payment public.payments%rowtype;
begin
  select booking_id into target_id from public.payments where provider = 'paymob' and provider_order_id = p_order_id;
  if not found then return; end if;
  perform 1 from public.bookings where id = target_id for update;
  select * into payment from public.payments where provider = 'paymob' and provider_order_id = p_order_id for update;
  if not found or payment.status in ('success', 'refunded') then return; end if;
  if p_currency is distinct from payment.currency::text or p_amount_cents is distinct from round(payment.amount * 100)::bigint then
    raise exception 'payment_amount_or_currency_mismatch';
  end if;

  update public.payments
  set status = case when p_success then 'success'::public.payment_status else 'failed'::public.payment_status end,
      provider_txn_id = p_transaction_id, raw = p_payload
  where id = payment.id;
  if p_success then
    update public.bookings set status = 'paid', updated_at = now() where id = target_id and status = 'pending';
  end if;
end;
$$;
revoke all on function public.apply_paymob_result(text, text, text, bigint, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.apply_paymob_result(text, text, text, bigint, boolean, jsonb) to service_role;

create function public.save_catalog_item(p_table text, p_id uuid, p_editing boolean, p_values jsonb, p_cost numeric)
returns uuid language plpgsql set search_path = ''
as $$
declare
  columns text;
  assignments text;
  cost_column text;
  saved_id uuid;
begin
  if not public.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  case p_table
    when 'cars' then
      columns := 'name_ar,name_en,description_ar,description_en,brand,model,year,seats,images,price_egp,price_usd,active';
      cost_column := 'car_id';
    when 'apartments' then
      columns := 'name_ar,name_en,description_ar,description_en,location_ar,location_en,bedrooms,max_guests,amenities,images,price_egp,price_usd,active';
      cost_column := 'apartment_id';
    when 'airport_services' then
      columns := 'icon,name_ar,name_en,description_ar,description_en,features_ar,features_en,price_egp,price_usd,sort_order,active,featured';
      cost_column := 'airport_service_id';
    when 'extras' then
      columns := 'name_ar,name_en,applies_to,per_day,price_egp,price_usd,active';
      cost_column := 'extra_id';
    else raise exception 'Unknown catalog type' using errcode = '22023';
  end case;

  select string_agg(format('%1$I = excluded.%1$I', field), ', ')
  into assignments from unnest(string_to_array(columns, ',')) as field;
  if p_table <> 'extras' then assignments := assignments || ', updated_at = now()'; end if;

  if p_editing then
    execute format('update public.%1$I set (%2$s) = (select %2$s from jsonb_populate_record(null::public.%1$I, $1))%3$s where id = $2 returning id',
      p_table, columns, case when p_table <> 'extras' then ', updated_at = now()' else '' end)
    into saved_id using p_values, p_id;
    if saved_id is null then raise exception 'Catalog item not found' using errcode = 'P0002'; end if;
  else
    execute format('insert into public.%1$I(id,%2$s) select $2,%2$s from jsonb_populate_record(null::public.%1$I,$1) on conflict(id) do update set %3$s returning id',
      p_table, columns, assignments)
    into saved_id using p_values, p_id;
  end if;

  if p_cost is null then
    execute format('delete from public.costs where %I = $1', cost_column) using saved_id;
  else
    execute format('insert into public.costs(%1$I,cost_egp) values ($1,$2) on conflict(%1$I) do update set cost_egp = excluded.cost_egp, updated_at = now()', cost_column)
    using saved_id, p_cost;
  end if;
  return saved_id;
end;
$$;
revoke all on function public.save_catalog_item(text, uuid, boolean, jsonb, numeric) from public, anon;
grant execute on function public.save_catalog_item(text, uuid, boolean, jsonb, numeric) to authenticated;

create function public.save_catalog_extras(p_items jsonb)
returns void language plpgsql set search_path = ''
as $$
declare
  item jsonb;
begin
  if not public.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    perform public.save_catalog_item('extras', (item->>'id')::uuid, false, item, (item->>'cost')::numeric);
  end loop;
end;
$$;
revoke all on function public.save_catalog_extras(jsonb) from public, anon;
grant execute on function public.save_catalog_extras(jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;


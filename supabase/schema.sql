-- thespot.lol schema
-- run this whole file in the supabase sql editor on a fresh project.

-- ============================================================
-- tables
-- ============================================================

create table listings (
  id             uuid primary key default gen_random_uuid(),
  identity_key   text        not null unique,
  display_url    text        not null,
  title          text        not null,
  description    text,
  total_paid     integer     not null default 0,  -- CENTS. this is the rank.
  clicks         integer     not null default 0,
  category       text        not null default 'other',
  favicon_url    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index listings_rank_idx on listings (total_paid desc, created_at asc);
create index listings_category_rank_idx on listings (category, total_paid desc, created_at asc);

create table payments (
  id              uuid primary key default gen_random_uuid(),
  polar_order_id  text        not null unique,
  identity_key    text        not null,
  amount_cents    integer     not null,
  refunded_cents  integer     not null default 0,
  status          text        not null,   -- 'paid' | 'partially_refunded' | 'refunded'
  raw_payload     jsonb,
  created_at      timestamptz not null default now()
);

-- /success polls by the order's checkout id and our client_ref
create index payments_checkout_id_idx on payments ((raw_payload->'data'->>'checkout_id'));
create index payments_client_ref_idx on payments ((raw_payload->'data'->'metadata'->>'client_ref'));

create table click_events (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references listings(id) on delete cascade,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

create index click_events_dedupe_idx on click_events (listing_id, ip_hash, created_at desc);

-- ============================================================
-- row level security
-- listings: public read only. payments, click_events: no public access.
-- every write goes through the server with the service role key.
-- ============================================================

alter table listings enable row level security;
alter table payments enable row level security;
alter table click_events enable row level security;

create policy "public read listings"
  on listings for select
  using (true);

-- no other policies. no public insert/update/delete anywhere.

-- ============================================================
-- realtime: broadcast listing changes to the board
-- ============================================================

alter publication supabase_realtime add table listings;

-- ============================================================
-- functions (called by the server via rpc with the service role key)
-- security definer + revoked from public so anon cannot call them.
-- ============================================================

-- credit a paid order to a listing, exactly once.
-- the insert into payments is the idempotency gate: the unique constraint
-- on polar_order_id makes webhook retries a no-op.
create or replace function handle_order_paid(
  p_order_id     text,
  p_identity_key text,
  p_display_url  text,
  p_title        text,
  p_description  text,
  p_amount_cents integer,
  p_category     text,
  p_favicon_url  text,
  p_raw          jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into payments (polar_order_id, identity_key, amount_cents, status, raw_payload)
  values (p_order_id, p_identity_key, p_amount_cents, 'paid', p_raw)
  on conflict (polar_order_id) do nothing;

  if not found then
    return;  -- already credited, webhook retry
  end if;

  insert into listings (identity_key, display_url, title, description, total_paid, category, favicon_url)
  values (p_identity_key, p_display_url, p_title, p_description, p_amount_cents,
          coalesce(nullif(p_category, ''), 'other'), p_favicon_url)
  on conflict (identity_key) do update set
    total_paid  = listings.total_paid + excluded.total_paid,
    title       = coalesce(nullif(excluded.title, ''), listings.title),
    description = coalesce(nullif(excluded.description, ''), listings.description),
    category    = coalesce(nullif(excluded.category, ''), listings.category),
    favicon_url = coalesce(excluded.favicon_url, listings.favicon_url),
    updated_at  = now();
end;
$$;

create or replace function handle_order_refunded(
  p_order_id       text,
  p_refunded_cents integer,
  p_raw            jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key  text;
  v_paid integer;
  v_old  integer;
  v_new  integer;
begin
  -- polar sends the CUMULATIVE refunded amount, so partial refunds
  -- arrive as a growing total. lock the row, compute the fresh delta,
  -- and subtract only that.
  select identity_key, amount_cents, refunded_cents
  into v_key, v_paid, v_old
  from payments
  where polar_order_id = p_order_id
  for update;

  if v_key is null then
    return;  -- unknown order
  end if;

  v_new := least(v_paid, greatest(v_old, p_refunded_cents));
  if v_new <= v_old then
    return;  -- replayed or out-of-order event, nothing new to refund
  end if;

  update payments
  set refunded_cents = v_new,
      status = case when v_new >= v_paid then 'refunded' else 'partially_refunded' end,
      raw_payload = p_raw
  where polar_order_id = p_order_id;

  update listings
  set total_paid = greatest(0, total_paid - (v_new - v_old)),
      updated_at = now()
  where identity_key = v_key;
end;
$$;

-- count an outbound click, deduped per ip hash per listing per 60 seconds.
-- returns the destination url, or null if the listing does not exist.
create or replace function record_click(
  p_listing_id uuid,
  p_ip_hash    text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
begin
  select display_url into v_url from listings where id = p_listing_id;
  if v_url is null then
    return null;
  end if;

  -- serialise per (listing, ip) so concurrent hits cannot both pass
  -- the dedupe check and double-count
  perform pg_advisory_xact_lock(hashtext(p_listing_id::text || p_ip_hash));

  if not exists (
    select 1 from click_events
    where listing_id = p_listing_id
      and ip_hash = p_ip_hash
      and created_at > now() - interval '60 seconds'
  ) then
    update listings set clicks = clicks + 1 where id = p_listing_id;
    insert into click_events (listing_id, ip_hash) values (p_listing_id, p_ip_hash);
  end if;

  return v_url;
end;
$$;

revoke execute on function handle_order_paid(text, text, text, text, text, integer, text, text, jsonb) from public, anon, authenticated;
revoke execute on function handle_order_refunded(text, integer, jsonb) from public, anon, authenticated;
revoke execute on function record_click(uuid, text) from public, anon, authenticated;

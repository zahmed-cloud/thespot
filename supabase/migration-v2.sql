-- v2 migration: categories + favicons.
-- only needed if the database was created from the v1 schema.sql.
-- fresh installs get all of this from schema.sql directly.

alter table listings add column category text not null default 'other';
alter table listings add column favicon_url text;

create index listings_category_rank_idx
  on listings (category, total_paid desc, created_at asc);

-- the old 7-arg handle_order_paid is replaced by the 9-arg version.
drop function if exists handle_order_paid(text, text, text, text, text, integer, jsonb);

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

revoke execute on function handle_order_paid(text, text, text, text, text, integer, text, text, jsonb) from public, anon, authenticated;

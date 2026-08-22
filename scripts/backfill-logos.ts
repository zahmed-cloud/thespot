/**
 * One-off logo backfill. Re-resolves every listing's logo with the
 * current resolver (platform mark → verified favicon → tile) and
 * updates the row. Run once before launch:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-logos.ts
 *
 * Safe to re-run; it just re-resolves everything.
 */
import { createClient } from "@supabase/supabase-js";
import { encodePlatform, resolveFavicon } from "../src/lib/logos.ts";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: rows, error } = await db
  .from("listings")
  .select("id, identity_key, favicon_url");
if (error) {
  console.error("could not read listings:", error.message);
  process.exit(1);
}

let changed = 0;
for (const row of rows ?? []) {
  const resolved =
    encodePlatform(row.identity_key) ??
    (row.identity_key.startsWith("x:")
      ? null
      : await resolveFavicon(row.identity_key));

  if (resolved === row.favicon_url) {
    console.log(`= ${row.identity_key} unchanged`);
    continue;
  }
  const { error: upErr } = await db
    .from("listings")
    .update({ favicon_url: resolved })
    .eq("id", row.id);
  if (upErr) {
    console.error(`! ${row.identity_key}: ${upErr.message}`);
    continue;
  }
  changed++;
  console.log(`✓ ${row.identity_key}: ${row.favicon_url ?? "null"} → ${resolved ?? "tile"}`);
}
console.log(`done. ${changed} of ${rows?.length ?? 0} rows updated.`);

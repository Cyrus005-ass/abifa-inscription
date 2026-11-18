import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, "public", any> | null = null;

// Client SERVEUR uniquement (clé service role). Ne jamais importer côté navigateur.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function db(): SupabaseClient<any, "public", any> {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

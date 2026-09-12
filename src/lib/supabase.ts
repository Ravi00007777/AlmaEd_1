import { createClient } from '@supabase/supabase-js';

// Service-role client for server-side storage uploads only — never expose
// this key to the client. Public reads are served via public bucket URLs.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const RESOURCES_BUCKET = 'resources';

// Supabase Storage helpers
// Uses @supabase/supabase-js

import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

const BUCKET = "proposals";

function getSupabaseAdmin() {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase credentials missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey);
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseAdmin();
  const key = normalizeKey(relKey);

  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, body, { contentType, upsert: true });

  if (error) throw new Error(`Supabase storage upload failed: ${error.message}`);

  const { data: signedData, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, 60 * 60 * 24 * 7); // 7 days

  if (urlError || !signedData) {
    throw new Error(`Supabase signed URL failed: ${urlError?.message}`);
  }

  return { key, url: signedData.signedUrl };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseAdmin();
  const key = normalizeKey(relKey);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, 60 * 60 * 24 * 7); // 7 days

  if (error || !data) {
    throw new Error(`Supabase signed URL failed: ${error?.message}`);
  }

  return { key, url: data.signedUrl };
}

export async function storageDelete(relKey: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const key = normalizeKey(relKey);

  const { error } = await supabase.storage.from(BUCKET).remove([key]);
  if (error) throw new Error(`Supabase storage delete failed: ${error.message}`);
}

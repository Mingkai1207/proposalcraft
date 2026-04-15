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

/**
 * Refresh a stale signed URL before it expires.
 * Handles both Supabase Storage URLs and legacy AWS S3 presigned URLs.
 * Non-fatal: returns the original URL unchanged on any error.
 *
 * Supabase format: https://<project>.supabase.co/storage/v1/object/sign/<bucket>/<key>?token=<jwt>
 * AWS S3 format:   https://<bucket>.s3.amazonaws.com/<key>?X-Amz-Date=...&X-Amz-Expires=...
 */
export async function refreshSignedUrlIfStale(storedUrl: string | null): Promise<string | null> {
  if (!storedUrl) return null;
  try {
    const parsed = new URL(storedUrl);

    // ── Supabase Storage signed URL ───────────────────────────────────────────
    if (
      parsed.hostname.includes(".supabase.co") &&
      parsed.pathname.includes("/storage/v1/object/sign/")
    ) {
      // Decode the JWT token to check remaining validity
      const token = parsed.searchParams.get("token");
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const padding = "=".repeat((4 - (parts[1].length % 4)) % 4);
            const payload = JSON.parse(
              Buffer.from(parts[1] + padding, "base64").toString("utf8")
            );
            const ONE_DAY_S = 24 * 60 * 60;
            // Still valid for more than 1 day — no need to refresh
            if (payload.exp && payload.exp - Date.now() / 1000 > ONE_DAY_S) {
              return storedUrl;
            }
          }
        } catch {
          // JWT decode failed — fall through and refresh unconditionally
        }
      }
      // Extract the storage key from the URL path
      // Path pattern: /storage/v1/object/sign/<bucket>/<key>
      const pathMatch = parsed.pathname.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+)/);
      if (!pathMatch) return storedUrl;
      const key = decodeURIComponent(pathMatch[1]);
      const { url: freshUrl } = await storageGet(key);
      return freshUrl;
    }

    // ── Legacy AWS S3 presigned URL ───────────────────────────────────────────
    const dateParam = parsed.searchParams.get("X-Amz-Date");
    const expiresParam = parsed.searchParams.get("X-Amz-Expires");
    if (!dateParam || !expiresParam) return storedUrl; // Not a recognised presigned URL
    const iso = `${dateParam.slice(0, 4)}-${dateParam.slice(4, 6)}-${dateParam.slice(6, 8)}T${dateParam.slice(9, 11)}:${dateParam.slice(11, 13)}:${dateParam.slice(13, 15)}Z`;
    const issuedAt = new Date(iso).getTime();
    if (isNaN(issuedAt)) return storedUrl;
    const expiresAt = issuedAt + parseInt(expiresParam, 10) * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (Date.now() < expiresAt - ONE_DAY_MS) return storedUrl; // Still valid
    const key = parsed.pathname.replace(/^\/+/, "");
    if (!key) return storedUrl;
    const { url: freshUrl } = await storageGet(key);
    return freshUrl;
  } catch {
    return storedUrl; // Non-fatal — return original URL on any error
  }
}

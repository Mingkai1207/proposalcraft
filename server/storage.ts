// Local filesystem-based storage for Railway volume.
// Files are written to STORAGE_DIR (mounted persistent volume in production),
// and served via a public Express route at /files/<key>.
//
// Security model: file keys contain a nanoid in the filename (caller-generated,
// typically 21+ chars / 126+ bits of entropy), so URLs are unguessable. Files
// aren't listed or indexed publicly, so the only way to access one is via its
// full URL. This matches the model Supabase signed URLs and S3 random-keyed
// private buckets use.
//
// Historical note: this codebase previously used AWS S3, then Supabase Storage.
// The `refreshSignedUrlIfStale` helper is kept for backward compatibility with
// any DB rows still containing URLs from those backends (it's a no-op for the
// current scheme, and for legacy URLs it returns them unchanged — dead-link
// handling is the caller's responsibility).

import { promises as fs } from "fs";
import path from "path";
import { ENV } from "./_core/env";

// STORAGE_DIR defaults to /app/uploads (matches the Railway volume mount path).
// In local dev without STORAGE_DIR set, falls back to ./uploads under cwd.
const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(process.cwd(), "uploads");

function normalizeKey(relKey: string): string {
  // Strip leading slashes, then resolve against STORAGE_DIR and verify the
  // resolved path is still inside STORAGE_DIR — prevents path-traversal via
  // "../" segments or absolute paths smuggled in the key.
  const stripped = relKey.replace(/^\/+/, "");
  const base = path.resolve(STORAGE_DIR);
  const resolved = path.resolve(base, stripped);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("Invalid storage key: path traversal attempted");
  }
  return stripped;
}

function buildPublicUrl(key: string): string {
  const origin = (ENV.appUrl || "").replace(/\/$/, "");
  // Encode each segment but keep path separators intact so nested keys work.
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${origin}/files/${encoded}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const fullPath = path.join(STORAGE_DIR, key);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  const body =
    typeof data === "string"
      ? Buffer.from(data, "utf-8")
      : Buffer.isBuffer(data)
        ? data
        : Buffer.from(data);

  await fs.writeFile(fullPath, body);

  return { key, url: buildPublicUrl(key) };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const fullPath = path.join(STORAGE_DIR, key);
  await fs.access(fullPath); // throws if missing
  return { key, url: buildPublicUrl(key) };
}

export async function storageDelete(relKey: string): Promise<void> {
  const key = normalizeKey(relKey);
  const fullPath = path.join(STORAGE_DIR, key);
  await fs.unlink(fullPath).catch((err: NodeJS.ErrnoException) => {
    // ENOENT is fine — target state reached regardless.
    if (err.code !== "ENOENT") throw err;
  });
}

/**
 * Compatibility shim from the Supabase/S3 era.
 *
 * Our `/files/<key>` URLs never expire, so for the current scheme this is a
 * no-op. For legacy URLs pointing at S3 or Supabase (kept in old DB rows),
 * we return them unchanged — the backing storage no longer exists, but
 * returning the URL avoids any crash path.
 */
export async function refreshSignedUrlIfStale(
  storedUrl: string | null
): Promise<string | null> {
  return storedUrl;
}

/**
 * Called by the Express `/files/<key>` route. Safely resolves a key to an
 * absolute path on disk (applying the same path-traversal check as writes)
 * and returns null if the file doesn't exist.
 */
export async function storageResolveFile(
  relKey: string
): Promise<string | null> {
  try {
    const key = normalizeKey(relKey);
    const fullPath = path.join(STORAGE_DIR, key);
    await fs.access(fullPath);
    return fullPath;
  } catch {
    return null;
  }
}

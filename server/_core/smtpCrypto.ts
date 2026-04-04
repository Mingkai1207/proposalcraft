/**
 * SMTP password encryption at rest.
 *
 * Encrypted values are prefixed with "enc:v1:" so we can distinguish
 * them from legacy plain-text passwords already in the DB — backward
 * compatible with existing rows.
 *
 * Uses AES-256-GCM (authenticated encryption) with a random 12-byte IV.
 * The key is derived from SMTP_ENCRYPTION_KEY (preferred) or JWT_SECRET
 * (fallback, hashed to 32 bytes with SHA-256).
 *
 * Format stored in DB:
 *   enc:v1:<hex-iv>:<hex-authTag>:<hex-ciphertext>
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENCRYPTED_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const raw = process.env.SMTP_ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  if (!raw) {
    throw new Error(
      "SMTP_ENCRYPTION_KEY (or JWT_SECRET) must be set to encrypt SMTP passwords."
    );
  }
  // Derive a 32-byte key regardless of input length
  return createHash("sha256").update(raw).digest();
}

export function encryptSmtpPassword(plaintext: string): string {
  if (!plaintext) return plaintext;
  // Already encrypted — skip re-encryption (idempotent)
  if (plaintext.startsWith(ENCRYPTED_PREFIX)) return plaintext;

  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSmtpPassword(stored: string): string {
  if (!stored) return stored;
  // Not encrypted (legacy plain-text row) — return as-is
  if (!stored.startsWith(ENCRYPTED_PREFIX)) return stored;

  const key = getEncryptionKey();
  const rest = stored.slice(ENCRYPTED_PREFIX.length);
  const parts = rest.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted SMTP password format");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

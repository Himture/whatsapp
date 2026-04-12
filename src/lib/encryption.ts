// Server-side encryption for WhatsApp access tokens stored in the database.
// Uses AES-256-GCM (authenticated encryption) so the auth tag detects
// tampering on decrypt. The client-side counterpart lives in ./crypto.ts
// and uses the same iv:tag:ciphertext hex format.
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import {
  ENCRYPTION_ALGORITHM,
  ENCRYPTION_IV_LENGTH,
  ENCRYPTION_TAG_LENGTH,
} from "./constants";

function getDerivedKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  return scryptSync(key, "whatsapp-api-salt", 32);
}

export function encrypt(plaintext: string): string {
  const derivedKey = getDerivedKey();
  const iv = randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted,
  ].join(":");
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted data format");
  }

  const derivedKey = getDerivedKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (authTag.length !== ENCRYPTION_TAG_LENGTH) {
    throw new Error("Invalid auth tag length");
  }

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

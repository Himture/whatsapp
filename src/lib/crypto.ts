"use client";

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "whatsapp-keyring";
const DB_VERSION = 1;
const STORE_NAME = "keys";
const MASTER_KEY_ID = "master";
const SALT_KEY_ID = "salt";
const VERIFICATION_KEY_ID = "verification";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 600_000;
const VERIFICATION_CONSTANT = "whatsapp-api-manager-key-check";

let cachedKey: CryptoKey | null = null;

async function getKeyringDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function initializeEncryptionKey(): Promise<void> {
  if (cachedKey) return;

  const db = await getKeyringDb();
  const existingRaw = await db.get(STORE_NAME, MASTER_KEY_ID) as ArrayBuffer | undefined;

  if (existingRaw) {
    cachedKey = await crypto.subtle.importKey(
      "raw",
      existingRaw,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"],
    );
    return;
  }

  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);
  await db.put(STORE_NAME, rawKey, MASTER_KEY_ID);
  cachedKey = key;
}

export async function setPassphrase(passphrase: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );

  const verificationIv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const verificationData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: verificationIv },
    derivedKey,
    encoder.encode(VERIFICATION_CONSTANT),
  );

  const db = await getKeyringDb();
  await db.put(STORE_NAME, salt.buffer, SALT_KEY_ID);
  await db.put(
    STORE_NAME,
    { iv: Array.from(verificationIv), data: Array.from(new Uint8Array(verificationData)) },
    VERIFICATION_KEY_ID,
  );
  await db.delete(STORE_NAME, MASTER_KEY_ID);

  cachedKey = derivedKey;
}

export async function unlockWithPassphrase(passphrase: string): Promise<boolean> {
  const db = await getKeyringDb();
  const salt = await db.get(STORE_NAME, SALT_KEY_ID) as ArrayBuffer | undefined;
  const verification = await db.get(STORE_NAME, VERIFICATION_KEY_ID) as
    | { iv: number[]; data: number[] }
    | undefined;

  if (!salt || !verification) return false;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );

  try {
    const iv = new Uint8Array(verification.iv);
    const data = new Uint8Array(verification.data);
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      derivedKey,
      data,
    );
    const decoded = new TextDecoder().decode(decrypted);
    if (decoded === VERIFICATION_CONSTANT) {
      cachedKey = derivedKey;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function hasPassphrase(): Promise<boolean> {
  const db = await getKeyringDb();
  const salt = await db.get(STORE_NAME, SALT_KEY_ID);
  return salt !== undefined;
}

export function isUnlocked(): boolean {
  return cachedKey !== null;
}

export async function encryptValue(plaintext: string): Promise<string> {
  if (!cachedKey) {
    await initializeEncryptionKey();
  }
  if (!cachedKey) {
    throw new Error("Encryption key not available");
  }

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    cachedKey,
    encoder.encode(plaintext),
  );

  // Web Crypto appends the 16-byte auth tag to the end of the ciphertext.
  // We split them to match the iv:tag:ciphertext format used server-side.
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);

  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");
  const tagHex = Array.from(authTag).map((b) => b.toString(16).padStart(2, "0")).join("");
  const cipherHex = Array.from(ciphertext).map((b) => b.toString(16).padStart(2, "0")).join("");

  return `${ivHex}:${tagHex}:${cipherHex}`;
}

export async function decryptValue(ciphertext: string): Promise<string> {
  if (!cachedKey) {
    await initializeEncryptionKey();
  }
  if (!cachedKey) {
    throw new Error("Encryption key not available");
  }

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }
  const [ivHex, tagHex, cipherHex] = parts;
  if (!ivHex || !tagHex || !cipherHex) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = new Uint8Array(ivHex.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? []);
  const authTag = new Uint8Array(tagHex.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? []);
  const encrypted = new Uint8Array(cipherHex.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? []);

  const combined = new Uint8Array(encrypted.length + authTag.length);
  combined.set(encrypted);
  combined.set(authTag, encrypted.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    cachedKey,
    combined,
  );

  return new TextDecoder().decode(decrypted);
}

export function clearKey(): void {
  cachedKey = null;
}

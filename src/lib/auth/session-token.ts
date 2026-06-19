import { type Role, normalizeRoles } from "./roles";

export const SESSION_COOKIE_NAME = "igbo_auth_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  roles: Role[];
  expiresAt: number;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  }

  return secret;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodeJson(value: unknown) {
  return bytesToBase64Url(textEncoder.encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(textDecoder.decode(base64UrlToBytes(value))) as T;
}

async function getHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signData(data: string) {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(data));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySignature(data: string, signature: string) {
  const key = await getHmacKey();
  return crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    textEncoder.encode(data),
  );
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<SessionPayload>;

  return (
    typeof payload.userId === "string" &&
    typeof payload.email === "string" &&
    typeof payload.name === "string" &&
    typeof payload.expiresAt === "number" &&
    Array.isArray(payload.roles)
  );
}

export async function createSessionToken(payload: Omit<SessionPayload, "expiresAt">) {
  const sessionPayload: SessionPayload = {
    ...payload,
    roles: normalizeRoles(payload.email, payload.roles),
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = encodeJson(sessionPayload);
  const signature = await signData(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const valid = await verifySignature(encodedPayload, signature);

    if (!valid) {
      return null;
    }

    const payload = decodeJson<unknown>(encodedPayload);

    if (!isSessionPayload(payload) || payload.expiresAt < Date.now()) {
      return null;
    }

    return {
      ...payload,
      roles: normalizeRoles(payload.email, payload.roles),
    };
  } catch {
    return null;
  }
}

import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 310000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";
const PASSWORD_PREFIX = "pbkdf2_sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString(
    "base64url",
  );

  return `${PASSWORD_PREFIX}$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [prefix, iterations, salt, hash] = storedHash.split("$");

  if (prefix !== PASSWORD_PREFIX || !iterations || !salt || !hash) {
    return false;
  }

  const attemptedHash = pbkdf2Sync(
    password,
    salt,
    Number(iterations),
    KEY_LENGTH,
    DIGEST,
  );
  const storedHashBuffer = Buffer.from(hash, "base64url");

  if (attemptedHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(attemptedHash, storedHashBuffer);
}

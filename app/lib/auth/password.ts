import crypto from 'crypto';

const PBKDF2_ITERATIONS = 150_000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export const generateSalt = (): string =>
  crypto.randomBytes(16).toString('hex');

export const hashPassword = (password: string, salt: string): string => {
  const derived = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );
  return derived.toString('hex');
};

export const verifyPassword = (
  password: string,
  salt: string,
  hash: string
): boolean => {
  const computed = hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(computed, 'hex')
  );
};

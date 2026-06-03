import crypto from 'crypto';

/**
 * Generates a SHA-256 hash for a user password with a fixed cryptographic salt.
 * Native crypto implementation to guarantee 100% build compatibility on Railway/Next.js.
 */
export function hashPassword(password: string): string {
  const salt = 'rotina-animada-tea-salt-key';
  return crypto
    .createHmac('sha256', salt)
    .update(password)
    .digest('hex');
}

/**
 * Compares a plain password against the stored password hash.
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

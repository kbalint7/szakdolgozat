import { createHash, randomBytes, randomInt } from 'node:crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomGroup(length: number): string {
  let group = '';
  for (let i = 0; i < length; i++) group += KEY_ALPHABET[randomInt(KEY_ALPHABET.length)];
  return group;
}

export function generateLicenseKey(): string {
  return ['LK', randomGroup(5), randomGroup(5), randomGroup(5), randomGroup(5)].join('-');
}

export function normalizeLicenseKey(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export type PrefixedSecret = { token: string; prefix: string; hash: string };

export function generatePrefixedSecret(kind: string): PrefixedSecret {
  const prefix = randomBytes(4).toString('hex');
  const token = `${kind}_${prefix}_${randomToken(32)}`;
  return { token, prefix, hash: sha256(token) };
}

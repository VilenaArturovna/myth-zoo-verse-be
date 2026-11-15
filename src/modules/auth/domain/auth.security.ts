import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import * as argon2 from 'argon2';

// 64 MiB, three passes, one lane: benchmark on the deployment host before tuning.
export const PASSWORD_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};
export const hashSecret = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export const newSecret = () => randomBytes(32).toString('base64url');
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const equalSecret = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};
export type AuthMethod = 'email' | 'telegram';
export type TokenPurpose = 'verify-email' | 'reset-password';
export interface AccessClaims {
  sub: string;
  sid: string;
  typ: 'access';
}
export const publicProfile = (user: any) => ({
  id: user.id,
  username: user.username,
  email: user.email ?? null,
  emailVerifiedAt: user.emailVerifiedAt ?? null,
  photoUrl: user.photoUrl ?? null,
  role: user.role,
  totalStitches: user.totalStitches,
  crystals: user.crystals,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

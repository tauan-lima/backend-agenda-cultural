import 'dotenv/config';
import { randomBytes, randomUUID } from 'crypto';
import NodeCache from 'node-cache';

const ttlSeconds = Number(process.env.REFRESH_TOKEN_TIMEOUT || 60 * 60 * 3); // default 3h
const checkperiod = Number(process.env.REFRESH_TOKEN_CHECKPERIOD || ttlSeconds + 1);
const absoluteTtlSeconds = Number(process.env.REFRESH_TOKEN_ABSOLUTE_TTL || 0); // 0 = desabilitado

type RefreshRecord = { userId: number | string };

type MemoryEntry = {
  userId: string;
  familyId: string;
  familyStartedAt: number; // epoch ms
  createdAt: number; // epoch ms
};

function base64url(input: Buffer) {
  return input.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

class RefreshTokenService {
  private cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod });

  generate(userId: number | string): string {
    const token = base64url(randomBytes(48));
    const now = Date.now();
    const entry: MemoryEntry = {
      userId: String(userId),
      familyId: randomUUID(),
      familyStartedAt: now,
      createdAt: now,
    };
    this.cache.set(token, entry, ttlSeconds);
    return token;
  }

  get(token: string | undefined | null): RefreshRecord | undefined {
    if (!token) return undefined;
    const entry = this.cache.get<MemoryEntry>(token);
    if (!entry) return undefined;
    if (absoluteTtlSeconds > 0 && entry.familyStartedAt + absoluteTtlSeconds * 1000 <= Date.now()) {
      this.cache.del(token);
      return undefined;
    }
    return { userId: entry.userId };
  }

  rotate(oldToken: string): { newToken: string; record: RefreshRecord } | null {
    const current = this.cache.get<MemoryEntry>(oldToken);
    if (!current) return null;
    // verifica TTL absoluto da família
    if (absoluteTtlSeconds > 0 && current.familyStartedAt + absoluteTtlSeconds * 1000 <= Date.now()) {
      this.cache.del(oldToken);
      return null;
    }
    // cria novo token e remove o antigo (revogação por deleção)
    const newToken = base64url(randomBytes(48));
    const now = Date.now();
    const entry: MemoryEntry = {
      userId: current.userId,
      familyId: current.familyId,
      familyStartedAt: current.familyStartedAt,
      createdAt: now,
    };
    this.cache.set(newToken, entry, ttlSeconds);
    this.cache.del(oldToken);
    return { newToken, record: { userId: current.userId } };
  }

  revoke(token: string | undefined | null): void {
    if (!token) return;
    this.cache.del(token);
  }

  get ttl(): number {
    return ttlSeconds;
  }
}

export const refreshTokenService = new RefreshTokenService();

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    path: '/',
    maxAge: ttlSeconds * 1000,
  };
}

export function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const parts = header.split(';');
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return undefined;
}

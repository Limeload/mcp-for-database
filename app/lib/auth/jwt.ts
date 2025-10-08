import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { JwtPayload, PublicUser } from '@/app/types/auth';

const AUTH_COOKIE_NAME = 'mcpdb_session';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET env not set');
  }
  return new TextEncoder().encode(secret);
}

export const issueJwt = async (
  user: PublicUser & { tokenVersion: number },
  expiresInSeconds: number = AUTH_COOKIE_MAX_AGE_SECONDS
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion,
    iat: now,
    exp: now + expiresInSeconds
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(payload.exp)
    .setSubject(payload.sub)
    .sign(getJwtSecret());
};

export const setSessionCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS
  });
};

export const clearSessionCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
};

export const getSessionToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token || null;
};

export const verifyJwt = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, getJwtSecret());
  // jose returns Record<string, unknown>; cast after minimal validation
  const required = [
    'sub',
    'email',
    'name',
    'role',
    'tokenVersion',
    'iat',
    'exp'
  ];
  for (const key of required) {
    if (!(key in payload)) {
      throw new Error('Invalid JWT payload');
    }
  }
  return payload as unknown as JwtPayload;
};

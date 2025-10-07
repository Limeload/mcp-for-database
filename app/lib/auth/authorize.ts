import { NextResponse } from 'next/server';
import {
  getSessionToken,
  verifyJwt,
  issueJwt,
  setSessionCookie
} from '@/app/lib/auth/jwt';
import { getStore } from '@/app/lib/auth/store';
import { hasPermission } from '@/app/lib/auth/permissions';
import { Permission, PublicUser } from '@/app/types/auth';
import { createErrorResponse } from '@/app/lib/api-response';

export type AuthResult =
  | {
      ok: true;
      user: PublicUser & { tokenVersion: number };
    }
  | {
      ok: false;
      response: NextResponse;
    };

export const authenticateRequest = async (): Promise<AuthResult> => {
  const token = await getSessionToken();
  if (!token) {
    // Optional auto-auth mode for development or environments explicitly enabling it
    const autoAuthEnabled =
      process.env.AUTO_AUTH === 'true' || process.env.AUTO_AUTH === '1';
    if (autoAuthEnabled) {
      try {
        const store = await getStore();
        const email = (
          process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com'
        ).toLowerCase();
        let user = await store.getUserByEmail(email);
        if (!user) {
          // Create an admin user if not exists (password only used to initialize)
          const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin1234';
          const created = await store.createUser({
            email,
            name: 'Auto Admin',
            role: 'admin',
            password
          });
          // Re-fetch full user to get tokenVersion
          user = await store.getUserById(created.id);
        }
        if (user) {
          const tokenJwt = await issueJwt({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tokenVersion: user.tokenVersion
          });
          await setSessionCookie(tokenJwt);
          const { id, email: e, name, role } = user;
          return {
            ok: true,
            user: { id, email: e, name, role, tokenVersion: user.tokenVersion }
          };
        }
      } catch {
        // fall through to standard 401 below
      }
    }
    return {
      ok: false,
      response: NextResponse.json(
        createErrorResponse('Authentication required', 'AUTH_REQUIRED'),
        { status: 401 }
      )
    };
  }

  try {
    const payload = await verifyJwt(token);
    const store = await getStore();
    const user = await store.getUserById(payload.sub);
    if (!user) {
      return {
        ok: false,
        response: NextResponse.json(
          createErrorResponse('User not found', 'AUTH_INVALID'),
          { status: 401 }
        )
      };
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      return {
        ok: false,
        response: NextResponse.json(
          createErrorResponse('Session revoked', 'AUTH_REVOKED'),
          { status: 401 }
        )
      };
    }
    const { id, email, name, role } = user;
    return {
      ok: true,
      user: { id, email, name, role, tokenVersion: user.tokenVersion }
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        createErrorResponse('Invalid token', 'AUTH_INVALID'),
        { status: 401 }
      )
    };
  }
};

export const authorize = async (
  permission: Permission
): Promise<AuthResult> => {
  const auth = await authenticateRequest();
  if (!auth.ok) return auth;
  if (!hasPermission(auth.user.role, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        createErrorResponse('Forbidden: insufficient permissions', 'FORBIDDEN'),
        { status: 403 }
      )
    };
  }
  return auth;
};

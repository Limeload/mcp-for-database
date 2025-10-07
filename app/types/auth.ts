import { z } from 'zod';

/**
 * Auth and RBAC core types
 */

export const USER_ROLES = ['admin', 'editor', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  'auth:me',
  'auth:logout',
  'users:list',
  'users:create',
  'users:update',
  'users:delete',
  'schema:read',
  'schema:manage',
  'db:test',
  'query:read',
  'query:write'
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(USER_ROLES),
  passwordHash: z.string(),
  passwordSalt: z.string(),
  tokenVersion: z.number().int().nonnegative()
});
export type User = z.infer<typeof UserSchema>;

export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;

export type CreateUserInput = {
  email: string;
  name: string;
  role: UserRole;
  password: string;
};

export type UpdateUserInput = Partial<{
  email: string;
  name: string;
  role: UserRole;
  password: string;
}>;

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  tokenVersion: number;
  iat: number;
  exp: number;
};

export type AuthenticatedRequestContext = {
  user: PublicUser & { tokenVersion: number };
};

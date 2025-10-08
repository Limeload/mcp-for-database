import { Permission, UserRole } from '@/app/types/auth';

/**
 * Role to permission mapping with a simple hierarchy.
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
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
  ],
  editor: [
    'auth:me',
    'auth:logout',
    'schema:read',
    'db:test',
    'query:read',
    'query:write'
  ],
  viewer: ['auth:me', 'auth:logout', 'schema:read', 'db:test', 'query:read']
};

export const getPermissionsForRole = (role: UserRole): Set<Permission> => {
  return new Set(ROLE_PERMISSIONS[role]);
};

export const hasPermission = (
  role: UserRole,
  permission: Permission
): boolean => {
  return getPermissionsForRole(role).has(permission);
};

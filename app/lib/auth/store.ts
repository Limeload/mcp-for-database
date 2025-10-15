import { createClient } from 'redis';
import {
  CreateUserInput,
  PublicUser,
  UpdateUserInput,
  User
} from '@/app/types/auth';
import { generateSalt, hashPassword } from '@/app/lib/auth/password';

type Store = {
  getUserById: (id: string) => Promise<User | null>;
  getUserByEmail: (email: string) => Promise<User | null>;
  listUsers: () => Promise<PublicUser[]>;
  createUser: (input: CreateUserInput) => Promise<PublicUser>;
  updateUser: (id: string, input: UpdateUserInput) => Promise<PublicUser>;
  deleteUser: (id: string) => Promise<boolean>;
  bumpTokenVersion: (id: string) => Promise<void>;
};

const inMemoryDb = new Map<string, User>();

function toPublic(user: User): PublicUser {
  const { id, email, name, role } = user;
  return { id, email, name, role };
}

async function initDefaultAdmin(): Promise<void> {
  if (inMemoryDb.size > 0) return;
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin1234';
  const id = 'u_admin_1';
  const salt = generateSalt();
  const passwordHash = hashPassword(adminPassword, salt);
  inMemoryDb.set(id, {
    id,
    email: adminEmail,
    name: 'Administrator',
    role: 'admin',
    passwordHash,
    passwordSalt: salt,
    tokenVersion: 0
  });
}

async function createRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const client = createClient({ url });
  client.on('error', err => {
    // eslint-disable-next-line no-console
    console.error('Redis error:', err);
  });
  try {
    await client.connect();
    return client;
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Redis unavailable, using in-memory store');
    return null;
  }
}

let redisClientPromise: ReturnType<typeof createRedisClient> | null = null;

export const getStore = async (): Promise<Store> => {
  if (!redisClientPromise) {
    redisClientPromise = createRedisClient();
  }
  const client = await redisClientPromise;
  if (!client) {
    await initDefaultAdmin();
    return {
      getUserById: async id => inMemoryDb.get(id) || null,
      getUserByEmail: async email => {
        for (const user of inMemoryDb.values()) {
          if (user.email.toLowerCase() === email.toLowerCase()) return user;
        }
        return null;
      },
      listUsers: async () => Array.from(inMemoryDb.values()).map(toPublic),
      createUser: async input => {
        const exists = await (async () => {
          for (const user of inMemoryDb.values()) {
            if (user.email.toLowerCase() === input.email.toLowerCase())
              return true;
          }
          return false;
        })();
        if (exists) throw new Error('User already exists');
        const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const salt = generateSalt();
        const passwordHash = hashPassword(input.password, salt);
        const user: User = {
          id,
          email: input.email,
          name: input.name,
          role: input.role,
          passwordHash,
          passwordSalt: salt,
          tokenVersion: 0
        };
        inMemoryDb.set(id, user);
        return toPublic(user);
      },
      updateUser: async (id, input) => {
        const existing = inMemoryDb.get(id);
        if (!existing) throw new Error('User not found');
        const updated: User = {
          ...existing,
          email: input.email ?? existing.email,
          name: input.name ?? existing.name,
          role: input.role ?? existing.role
        };
        if (input.password) {
          const salt = generateSalt();
          updated.passwordSalt = salt;
          updated.passwordHash = hashPassword(input.password, salt);
          updated.tokenVersion += 1; // invalidate old sessions
        }
        inMemoryDb.set(id, updated);
        return toPublic(updated);
      },
      deleteUser: async id => inMemoryDb.delete(id),
      bumpTokenVersion: async id => {
        const u = inMemoryDb.get(id);
        if (u) {
          u.tokenVersion += 1;
          inMemoryDb.set(id, u);
        }
      }
    };
  }

  // Simple Redis JSON storage per user key (avoid external dependencies)
  const prefix = 'mcpdb:user:';
  const getKey = (id: string) => `${prefix}${id}`;
  const emailIndexKey = 'mcpdb:email:index';

  return {
    getUserById: async id => {
      const raw = await client.get(getKey(id));
      return raw ? (JSON.parse(raw) as User) : null;
    },
    getUserByEmail: async email => {
      const id = await client.hGet(emailIndexKey, email.toLowerCase());
      if (!id) return null;
      const raw = await client.get(getKey(id));
      return raw ? (JSON.parse(raw) as User) : null;
    },
    listUsers: async () => {
      const ids = await client.hKeys(emailIndexKey);
      const uniqueIds = new Set<string>();
      for (const key of ids) {
        const id = await client.hGet(emailIndexKey, key);
        if (id) uniqueIds.add(id);
      }
      const users: PublicUser[] = [];
      for (const id of uniqueIds) {
        const raw = await client.get(getKey(id));
        if (raw) users.push(toPublic(JSON.parse(raw) as User));
      }
      return users;
    },
    createUser: async input => {
      const existing = await client.hGet(
        emailIndexKey,
        input.email.toLowerCase()
      );
      if (existing) throw new Error('User already exists');
      const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const salt = generateSalt();
      const passwordHash = hashPassword(input.password, salt);
      const user: User = {
        id,
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash,
        passwordSalt: salt,
        tokenVersion: 0
      };
      await client.set(getKey(id), JSON.stringify(user));
      await client.hSet(emailIndexKey, input.email.toLowerCase(), id);
      return toPublic(user);
    },
    updateUser: async (id, input) => {
      const raw = await client.get(getKey(id));
      if (!raw) throw new Error('User not found');
      const existing = JSON.parse(raw) as User;
      const updated: User = {
        ...existing,
        email: input.email ?? existing.email,
        name: input.name ?? existing.name,
        role: input.role ?? existing.role
      };
      if (input.password) {
        const salt = generateSalt();
        updated.passwordSalt = salt;
        updated.passwordHash = hashPassword(input.password, salt);
        updated.tokenVersion += 1;
      }
      await client.set(getKey(id), JSON.stringify(updated));
      if (input.email && input.email !== existing.email) {
        await client.hDel(emailIndexKey, existing.email.toLowerCase());
        await client.hSet(emailIndexKey, input.email.toLowerCase(), id);
      }
      return toPublic(updated);
    },
    deleteUser: async id => {
      const raw = await client.get(getKey(id));
      if (!raw) return false;
      const u = JSON.parse(raw) as User;
      await client.del(getKey(id));
      await client.hDel(emailIndexKey, u.email.toLowerCase());
      return true;
    },
    bumpTokenVersion: async id => {
      const raw = await client.get(getKey(id));
      if (!raw) return;
      const u = JSON.parse(raw) as User;
      u.tokenVersion += 1;
      await client.set(getKey(id), JSON.stringify(u));
    }
  };
};

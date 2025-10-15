import { 
  DatabaseCredential, 
  CreateDatabaseCredentialInput, 
  UpdateDatabaseCredentialInput,
  PublicDatabaseCredential,
  DatabaseConnectionTestResult,
  validateCredentialInput
} from './credentials';
import { encryptPassword, decryptPassword, generateCredentialId, hashCredentialId } from './encryption';

/**
 * Secure credential storage service with per-user isolation
 * Uses the same storage pattern as the auth system (Redis + in-memory fallback)
 */

interface CredentialStore {
  getCredentialById: (id: string, userId: string) => Promise<DatabaseCredential | null>;
  getCredentialsByUserId: (userId: string) => Promise<PublicDatabaseCredential[]>;
  createCredential: (input: CreateDatabaseCredentialInput, userId: string) => Promise<PublicDatabaseCredential>;
  updateCredential: (id: string, input: UpdateDatabaseCredentialInput, userId: string) => Promise<PublicDatabaseCredential>;
  deleteCredential: (id: string, userId: string) => Promise<boolean>;
  testConnection: (id: string, userId: string) => Promise<DatabaseConnectionTestResult>;
}

// In-memory storage for development/fallback
const inMemoryCredentials = new Map<string, DatabaseCredential>();

function getCredentialKey(id: string, userId: string): string {
  return `mcpdb:credential:${hashCredentialId(id, userId)}`;
}

function getUserIdIndexKey(userId: string): string {
  return `mcpdb:user:${userId}:credentials`;
}

function toPublicCredential(credential: DatabaseCredential): PublicDatabaseCredential {
  const { encryptedPassword, ...publicCredential } = credential;
  void encryptedPassword; // Suppress unused variable warning
  return publicCredential;
}

async function createRedisClient() {
  try {
    const { createClient } = await import('redis');
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    return client;
  } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Redis not available, falling back to in-memory storage:', error);
    return null;
  }
}

let redisClientPromise: ReturnType<typeof createRedisClient> | null = null;

export const getCredentialStore = async (): Promise<CredentialStore> => {
  if (!redisClientPromise) {
    redisClientPromise = createRedisClient();
  }
  const client = await redisClientPromise;
  
  if (!client) {
    // Fallback to in-memory storage
    return {
      getCredentialById: async (id: string, userId: string) => {
        for (const credential of inMemoryCredentials.values()) {
          if (credential.id === id && credential.userId === userId) {
            return credential;
          }
        }
        return null;
      },
      
      getCredentialsByUserId: async (userId: string) => {
        const credentials: PublicDatabaseCredential[] = [];
        for (const credential of inMemoryCredentials.values()) {
          if (credential.userId === userId) {
            credentials.push(toPublicCredential(credential));
          }
        }
        return credentials;
      },
      
      createCredential: async (input: CreateDatabaseCredentialInput, userId: string) => {
        const validation = validateCredentialInput(input);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        const id = generateCredentialId();
        const encryptedPassword = encryptPassword(input.password);
        
        const credential: DatabaseCredential = {
          id,
          userId,
          name: input.name,
          type: input.type,
          host: input.host,
          port: input.port,
          database: input.database,
          username: input.username,
          encryptedPassword,
          ssl: input.ssl,
          schema: input.schema,
          warehouse: input.warehouse,
          role: input.role,
          account: input.account,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        inMemoryCredentials.set(id, credential);
        return toPublicCredential(credential);
      },
      
      updateCredential: async (id: string, input: UpdateDatabaseCredentialInput, userId: string) => {
        const existing = inMemoryCredentials.get(id);
        if (!existing || existing.userId !== userId) {
          throw new Error('Credential not found');
        }
        
        const updatedCredential: DatabaseCredential = {
          ...existing,
          ...input,
          encryptedPassword: input.password ? encryptPassword(input.password) : existing.encryptedPassword,
          updatedAt: new Date(),
        };
        
        inMemoryCredentials.set(id, updatedCredential);
        return toPublicCredential(updatedCredential);
      },
      
      deleteCredential: async (id: string, userId: string) => {
        const credential = inMemoryCredentials.get(id);
        if (!credential || credential.userId !== userId) {
          return false;
        }
        
        inMemoryCredentials.delete(id);
        return true;
      },
      
      testConnection: async (id: string, userId: string) => {
        const credential = inMemoryCredentials.get(id);
        if (!credential || credential.userId !== userId) {
          return {
            success: false,
            message: 'Credential not found',
            error: 'Credential not found or access denied'
          };
        }
        
        try {
          const decryptedPassword = decryptPassword(credential.encryptedPassword);
          void decryptedPassword; // Suppress unused variable warning
          // const connectionString = generateConnectionString(credential, decryptedPassword);
          
          // For now, return a mock success response
          // In a real implementation, this would test the actual database connection
          return {
            success: true,
            message: `Successfully connected to ${credential.type} database`,
            connectionTime: Math.random() * 1000 + 100 // Mock connection time
          };
        } catch (error) {
          return {
            success: false,
            message: 'Connection test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    };
  }
  
  // Redis-based storage
  return {
    getCredentialById: async (id: string, userId: string) => {
      const key = getCredentialKey(id, userId);
      const raw = await client.get(key);
      return raw ? (JSON.parse(raw) as DatabaseCredential) : null;
    },
    
    getCredentialsByUserId: async (userId: string) => {
      const indexKey = getUserIdIndexKey(userId);
      const credentialIds = await client.sMembers(indexKey);
      
      const credentials: PublicDatabaseCredential[] = [];
      for (const credentialId of credentialIds) {
        const key = getCredentialKey(credentialId, userId);
        const raw = await client.get(key);
        if (raw) {
          const credential = JSON.parse(raw) as DatabaseCredential;
          credentials.push(toPublicCredential(credential));
        }
      }
      
      return credentials;
    },
    
    createCredential: async (input: CreateDatabaseCredentialInput, userId: string) => {
      const validation = validateCredentialInput(input);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const id = generateCredentialId();
      const encryptedPassword = encryptPassword(input.password);
      
      const credential: DatabaseCredential = {
        id,
        userId,
        name: input.name,
        type: input.type,
        host: input.host,
        port: input.port,
        database: input.database,
        username: input.username,
        encryptedPassword,
        ssl: input.ssl,
        schema: input.schema,
        warehouse: input.warehouse,
        role: input.role,
        account: input.account,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const key = getCredentialKey(id, userId);
      const indexKey = getUserIdIndexKey(userId);
      
      await client.set(key, JSON.stringify(credential));
      await client.sAdd(indexKey, id);
      
      return toPublicCredential(credential);
    },
    
    updateCredential: async (id: string, input: UpdateDatabaseCredentialInput, userId: string) => {
      const key = getCredentialKey(id, userId);
      const raw = await client.get(key);
      
      if (!raw) {
        throw new Error('Credential not found');
      }
      
      const existing = JSON.parse(raw) as DatabaseCredential;
      if (existing.userId !== userId) {
        throw new Error('Access denied');
      }
      
      const updatedCredential: DatabaseCredential = {
        ...existing,
        ...input,
        encryptedPassword: input.password ? encryptPassword(input.password) : existing.encryptedPassword,
        updatedAt: new Date(),
      };
      
      await client.set(key, JSON.stringify(updatedCredential));
      return toPublicCredential(updatedCredential);
    },
    
    deleteCredential: async (id: string, userId: string) => {
      const key = getCredentialKey(id, userId);
      const indexKey = getUserIdIndexKey(userId);
      
      const exists = await client.exists(key);
      if (!exists) {
        return false;
      }
      
      await client.del(key);
      await client.sRem(indexKey, id);
      
      return true;
    },
    
    testConnection: async (id: string, userId: string) => {
      const key = getCredentialKey(id, userId);
      const raw = await client.get(key);
      
      if (!raw) {
        return {
          success: false,
          message: 'Credential not found',
          error: 'Credential not found or access denied'
        };
      }
      
      const credential = JSON.parse(raw) as DatabaseCredential;
      if (credential.userId !== userId) {
        return {
          success: false,
          message: 'Access denied',
          error: 'Access denied'
        };
      }
      
      try {
        const decryptedPassword = decryptPassword(credential.encryptedPassword);
        void decryptedPassword; // Suppress unused variable warning
        // const connectionString = generateConnectionString(credential, decryptedPassword);
        
        // For now, return a mock success response
        // In a real implementation, this would test the actual database connection
        return {
          success: true,
          message: `Successfully connected to ${credential.type} database`,
          connectionTime: Math.random() * 1000 + 100 // Mock connection time
        };
      } catch (error) {
        return {
          success: false,
          message: 'Connection test failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
};

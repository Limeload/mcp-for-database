import { z } from 'zod';

/**
 * Database credential management types and interfaces
 */

export const DATABASE_TYPES = ['postgresql', 'mysql', 'snowflake', 'sqlite'] as const;
export type DatabaseType = (typeof DATABASE_TYPES)[number];

export const DatabaseCredentialSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  type: z.enum(DATABASE_TYPES),
  host: z.string().min(1),
  port: z.number().int().positive(),
  database: z.string().min(1),
  username: z.string().min(1),
  encryptedPassword: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Optional fields for additional configuration
  ssl: z.boolean().optional(),
  schema: z.string().optional(),
  warehouse: z.string().optional(), // For Snowflake
  role: z.string().optional(), // For Snowflake
  account: z.string().optional(), // For Snowflake
});

export type DatabaseCredential = z.infer<typeof DatabaseCredentialSchema>;

export type CreateDatabaseCredentialInput = {
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  schema?: string;
  warehouse?: string;
  role?: string;
  account?: string;
};

export type UpdateDatabaseCredentialInput = Partial<{
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  schema: string;
  warehouse: string;
  role: string;
  account: string;
}>;

export type PublicDatabaseCredential = Omit<DatabaseCredential, 'encryptedPassword'>;

export type DatabaseConnectionTestResult = {
  success: boolean;
  message: string;
  connectionTime?: number;
  error?: string;
};

export type DatabaseConnectionString = {
  type: DatabaseType;
  connectionString: string;
  ssl?: boolean;
};

/**
 * Credential validation rules per database type
 */
export const DATABASE_VALIDATION_RULES = {
  postgresql: {
    defaultPort: 5432,
    requiredFields: ['host', 'port', 'database', 'username', 'password'],
    optionalFields: ['ssl', 'schema'],
  },
  mysql: {
    defaultPort: 3306,
    requiredFields: ['host', 'port', 'database', 'username', 'password'],
    optionalFields: ['ssl', 'schema'],
  },
  snowflake: {
    defaultPort: 443,
    requiredFields: ['account', 'warehouse', 'database', 'username', 'password'],
    optionalFields: ['role', 'schema'],
  },
  sqlite: {
    defaultPort: 0, // Not applicable for SQLite
    requiredFields: ['database'], // For SQLite, database is the file path
    optionalFields: [],
  },
} as const;

/**
 * Generate a connection string from credential data
 */
export function generateConnectionString(credential: DatabaseCredential, decryptedPassword: string): DatabaseConnectionString {
  const { type, host, port, database, username, ssl } = credential;
  
  switch (type) {
    case 'postgresql': {
      const pgSsl = ssl ? '?sslmode=require' : '';
      return {
        type: 'postgresql',
        connectionString: `postgresql://${username}:${decryptedPassword}@${host}:${port}/${database}${pgSsl}`,
        ssl,
      };
    }
    
    case 'mysql': {
      const mysqlSsl = ssl ? '?ssl=true' : '';
      return {
        type: 'mysql',
        connectionString: `mysql://${username}:${decryptedPassword}@${host}:${port}/${database}${mysqlSsl}`,
        ssl,
      };
    }
    
    case 'snowflake': {
      const { account, warehouse, role, schema } = credential;
      const snowflakeParams = new URLSearchParams();
      if (warehouse) snowflakeParams.set('warehouse', warehouse);
      if (role) snowflakeParams.set('role', role);
      if (schema) snowflakeParams.set('schema', schema);
      
      const paramString = snowflakeParams.toString() ? `?${snowflakeParams.toString()}` : '';
      return {
        type: 'snowflake',
        connectionString: `snowflake://${username}:${decryptedPassword}@${account}/${database}${paramString}`,
      };
    }
    
    case 'sqlite':
      return {
        type: 'sqlite',
        connectionString: `sqlite:///${database}`,
      };
    
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}

/**
 * Validate credential input based on database type
 */
export function validateCredentialInput(input: CreateDatabaseCredentialInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rules = DATABASE_VALIDATION_RULES[input.type];
  
  // Check required fields
  for (const field of rules.requiredFields) {
    if (!input[field as keyof CreateDatabaseCredentialInput]) {
      errors.push(`Field '${field}' is required for ${input.type} databases`);
    }
  }
  
  // Type-specific validations
  switch (input.type) {
    case 'postgresql':
    case 'mysql':
      if (input.port && (input.port < 1 || input.port > 65535)) {
        errors.push('Port must be between 1 and 65535');
      }
      break;
    
    case 'snowflake':
      if (input.account && !input.account.includes('.')) {
        errors.push('Snowflake account must include the full account identifier (e.g., "account.region")');
      }
      break;
    
    case 'sqlite':
      // For SQLite, database field should be a valid file path
      if (input.database && !input.database.includes('/') && !input.database.includes('\\')) {
        errors.push('SQLite database must be a valid file path');
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Database target types
export type DatabaseTarget = 'sqlalchemy' | 'snowflake' | 'sqlite';

// API request types
export interface DatabaseQueryRequest {
  prompt: string;
  target: DatabaseTarget;
  credentialId?: string; // Optional credential ID for user-specific database connections
}

// API response types (DEPRECATED - use ApiResponse from @/app/lib/api-response)
export interface DatabaseQueryResponse {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
  query?: string;
  executionTime?: number;
  // Indicates that the response was generated from local mock data (MCP server unreachable)
  mocked?: boolean;
}

// Error response type (DEPRECATED - use ApiResponse from @/app/lib/api-response)
export interface DatabaseErrorResponse {
  success: false;
  error: string;
}

// Schema metadata types
export interface ColumnMetadata {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
  maxLength?: number;
  precision?: number;
  scale?: number;
  constraints: string[];
  foreignKeyReference?: {
    table: string;
    column: string;
  };
}

export interface TableMetadata {
  name: string;
  schema: string;
  type: 'table' | 'view' | 'materialized_view';
  columns: ColumnMetadata[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyMetadata[];
  indexes: IndexMetadata[];
  rowCount?: number;
  description?: string;
}

export interface ForeignKeyMetadata {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

export interface IndexMetadata {
  name: string;
  columns: string[];
  isUnique: boolean;
  type: string;
}

export interface RelationshipMetadata {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
  constraintName: string;
}

export interface SchemaMetadata {
  version: string;
  lastUpdated: string;
  tables: TableMetadata[];
  relationships: RelationshipMetadata[];
  schemas: string[];
  totalTables: number;
  totalColumns: number;
}

// DEPRECATED - use ApiResponse from @/app/lib/api-response
export interface SchemaResponse {
  success: boolean;
  data?: SchemaMetadata;
  error?: string;
  cached: boolean;
  cacheAge?: number;
}

export interface SchemaCacheEntry {
  data: SchemaMetadata;
  timestamp: number;
  version: string;
  target: DatabaseTarget;
}

export interface Shortcut {
  keys: string[];
  action: () => void;
  description: string;
}

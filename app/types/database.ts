// Database target types
export type DatabaseTarget = 'sqlalchemy' | 'snowflake';

// API request types
export interface DatabaseQueryRequest {
  prompt: string;
  target: DatabaseTarget;
  connectionId?: string;
  maxExecutionTime?: number;
}

// API response types
export interface DatabaseQueryResponse {
  success: boolean;
  data?: any[];
  error?: string;
  query?: string;
  executionTime?: number;
  connectionId?: string;
  activeConnections?: number;
}

// Error response type
export interface DatabaseErrorResponse {
  success: false;
  error: string;
  activeConnections?: number;
}

// Connection management types
export interface ConnectionInfo {
  id: string;
  target: DatabaseTarget;
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
  queryCount: number;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  connectionsByTarget: Record<DatabaseTarget, number>;
  averageQueryTime: number;
  totalQueries: number;
}

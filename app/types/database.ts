// Database target types
export type DatabaseTarget = "sqlalchemy" | "snowflake";

// API request types
export interface DatabaseQueryRequest {
  prompt: string;
  target: DatabaseTarget;
}

// API response types
export interface DatabaseQueryResponse {
  success: boolean;
  data?: any[];
  error?: string;
  query?: string;
  executionTime?: number;
}

// Error response type
export interface DatabaseErrorResponse {
  success: false;
  error: string;
}

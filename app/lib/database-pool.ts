import { DatabaseTarget, DatabaseQueryResponse } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

export interface ConnectionPoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  cleanupInterval: number;
}

export interface DatabaseConnection {
  id: string;
  target: DatabaseTarget;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
  isIdle: boolean;
  queryCount: number;
}

export interface QueryRequest {
  prompt: string;
  target: DatabaseTarget;
  connectionId?: string;
  maxExecutionTime?: number;
}

export interface QueryResult {
  data: any[];
  query: string;
  executionTime: number;
  connectionId: string;
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  connectionsByTarget: Record<DatabaseTarget, number>;
  averageQueryTime: number;
  totalQueries: number;
}

export class DatabaseConnectionPool {
  private connections: Map<string, DatabaseConnection> = new Map();
  private config: ConnectionPoolConfig;
  private cleanupTimer: NodeJS.Timeout;
  private queryStats: {
    totalQueries: number;
    totalExecutionTime: number;
  } = {
    totalQueries: 0,
    totalExecutionTime: 0
  };

  constructor(config: ConnectionPoolConfig) {
    this.config = config;
    
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, config.cleanupInterval);
  }

  async executeQuery(request: QueryRequest): Promise<QueryResult> {
    const startTime = Date.now();
    
    // Get or create connection
    const connection = await this.getConnection(request.target, request.connectionId);
    
    try {
      // Execute query through existing API
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          target: request.target,
          connectionId: connection.id
        }),
        signal: AbortSignal.timeout(request.maxExecutionTime || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DatabaseQueryResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Query execution failed');
      }

      const executionTime = Date.now() - startTime;
      
      // Update connection stats
      connection.lastUsed = new Date();
      connection.queryCount++;
      connection.isActive = false;
      connection.isIdle = true;
      
      // Update global stats
      this.queryStats.totalQueries++;
      this.queryStats.totalExecutionTime += executionTime;

      return {
        data: result.data || [],
        query: result.query || '',
        executionTime,
        connectionId: connection.id
      };

    } catch (error) {
      // Mark connection as idle on error
      connection.isActive = false;
      connection.isIdle = true;
      connection.lastUsed = new Date();
      
      throw error;
    }
  }

  private async getConnection(target: DatabaseTarget, connectionId?: string): Promise<DatabaseConnection> {
    // If specific connection requested, try to find it
    if (connectionId) {
      const existingConnection = this.connections.get(connectionId);
      if (existingConnection && existingConnection.target === target) {
        existingConnection.isActive = true;
        existingConnection.isIdle = false;
        return existingConnection;
      }
    }

    // Look for idle connection of the same target type
    for (const connection of this.connections.values()) {
      if (connection.target === target && connection.isIdle && !connection.isActive) {
        connection.isActive = true;
        connection.isIdle = false;
        return connection;
      }
    }

    // Check if we can create a new connection
    if (this.connections.size >= this.config.maxConnections) {
      // Try to cleanup idle connections first
      await this.cleanupIdleConnections();
      
      // If still at limit, throw error
      if (this.connections.size >= this.config.maxConnections) {
        throw new Error(`Maximum connections (${this.config.maxConnections}) reached`);
      }
    }

    // Create new connection
    const newConnection: DatabaseConnection = {
      id: connectionId || uuidv4(),
      target,
      createdAt: new Date(),
      lastUsed: new Date(),
      isActive: true,
      isIdle: false,
      queryCount: 0
    };

    this.connections.set(newConnection.id, newConnection);
    return newConnection;
  }

  async cleanupIdleConnections(): Promise<number> {
    const now = Date.now();
    const idleThreshold = now - this.config.idleTimeout;
    const connectionsToRemove: string[] = [];

    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.isIdle && !connection.isActive && 
          connection.lastUsed.getTime() < idleThreshold) {
        connectionsToRemove.push(connectionId);
      }
    }

    // Remove idle connections
    for (const connectionId of connectionsToRemove) {
      await this.closeConnection(connectionId);
    }

    return connectionsToRemove.length;
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Here you would normally close the actual database connection
      // For now, we just remove it from our pool
      this.connections.delete(connectionId);
    }
  }

  async closeAllConnections(): Promise<void> {
    for (const connectionId of this.connections.keys()) {
      await this.closeConnection(connectionId);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  getActiveConnectionCount(): number {
    return Array.from(this.connections.values()).filter(conn => conn.isActive).length;
  }

  getStats(): ConnectionStats {
    const connections = Array.from(this.connections.values());
    const connectionsByTarget = connections.reduce((acc, conn) => {
      acc[conn.target] = (acc[conn.target] || 0) + 1;
      return acc;
    }, {} as Record<DatabaseTarget, number>);

    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(conn => conn.isActive).length,
      idleConnections: connections.filter(conn => conn.isIdle).length,
      connectionsByTarget,
      averageQueryTime: this.queryStats.totalQueries > 0 
        ? this.queryStats.totalExecutionTime / this.queryStats.totalQueries 
        : 0,
      totalQueries: this.queryStats.totalQueries
    };
  }
}

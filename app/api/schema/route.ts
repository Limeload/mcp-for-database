import { NextRequest, NextResponse } from 'next/server';
import { SchemaMetadata, TableMetadata } from '@/app/types/database';
import {
  createSuccessResponse,
  createErrorResponse
} from '@/app/lib/api-response';
import { authorize } from '@/app/lib/auth/authorize';

// Cache for schema data (in-memory cache)
interface SchemaCache {
  [key: string]: {
    data: SchemaMetadata;
    timestamp: number;
    version: string;
  };
}

const schemaCache: SchemaCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Generates mock schema data for development/demo purposes
 */
function generateMockSchemaData(target: string): SchemaMetadata {
  const baseTimestamp = new Date().toISOString();
  const version = `1.0.0-mock-${Date.now()}`;

  if (target === 'sqlalchemy') {
    const usersTable: TableMetadata = {
      name: 'users',
      schema: 'public',
      type: 'table',
      columns: [
        {
          name: 'id',
          dataType: 'INTEGER',
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          constraints: ['PRIMARY KEY', 'AUTO_INCREMENT'],
          precision: 10,
          scale: 0
        },
        {
          name: 'email',
          dataType: 'VARCHAR',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['UNIQUE', 'NOT NULL'],
          maxLength: 255
        },
        {
          name: 'name',
          dataType: 'VARCHAR',
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: [],
          maxLength: 100
        },
        {
          name: 'created_at',
          dataType: 'TIMESTAMP',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          defaultValue: 'NOW()'
        }
      ],
      primaryKeys: ['id'],
      foreignKeys: [],
      indexes: [
        {
          name: 'idx_users_email',
          columns: ['email'],
          isUnique: true,
          type: 'BTREE'
        }
      ],
      rowCount: 1250,
      description: 'User accounts table'
    };

    const ordersTable: TableMetadata = {
      name: 'orders',
      schema: 'public',
      type: 'table',
      columns: [
        {
          name: 'id',
          dataType: 'INTEGER',
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          constraints: ['PRIMARY KEY', 'AUTO_INCREMENT'],
          precision: 10,
          scale: 0
        },
        {
          name: 'user_id',
          dataType: 'INTEGER',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: true,
          constraints: ['NOT NULL', 'FOREIGN KEY'],
          foreignKeyReference: {
            table: 'users',
            column: 'id'
          },
          precision: 10,
          scale: 0
        },
        {
          name: 'total_amount',
          dataType: 'DECIMAL',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          precision: 10,
          scale: 2
        },
        {
          name: 'status',
          dataType: 'VARCHAR',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          defaultValue: 'pending',
          maxLength: 50
        },
        {
          name: 'created_at',
          dataType: 'TIMESTAMP',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          defaultValue: 'NOW()'
        }
      ],
      primaryKeys: ['id'],
      foreignKeys: [
        {
          name: 'fk_orders_user_id',
          columns: ['user_id'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      ],
      indexes: [
        {
          name: 'idx_orders_user_id',
          columns: ['user_id'],
          isUnique: false,
          type: 'BTREE'
        },
        {
          name: 'idx_orders_status',
          columns: ['status'],
          isUnique: false,
          type: 'BTREE'
        }
      ],
      rowCount: 5420,
      description: 'Customer orders table'
    };

    return {
      version: version,
      lastUpdated: baseTimestamp,
      tables: [usersTable, ordersTable],
      relationships: [
        {
          type: 'one-to-many',
          fromTable: 'users',
          fromColumns: ['id'],
          toTable: 'orders',
          toColumns: ['user_id'],
          constraintName: 'fk_orders_user_id'
        }
      ],
      schemas: ['public'],
      totalTables: 2,
      totalColumns: 9
    };
  } else if (target === 'snowflake') {
    const customersTable: TableMetadata = {
      name: 'CUSTOMERS',
      schema: 'PUBLIC',
      type: 'table',
      columns: [
        {
          name: 'CUSTOMER_ID',
          dataType: 'NUMBER',
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          constraints: ['PRIMARY KEY', 'IDENTITY'],
          precision: 38,
          scale: 0
        },
        {
          name: 'CUSTOMER_NAME',
          dataType: 'VARCHAR',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          maxLength: 100
        },
        {
          name: 'REGION',
          dataType: 'VARCHAR',
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: [],
          maxLength: 50
        },
        {
          name: 'CREATED_DATE',
          dataType: 'TIMESTAMP_NTZ',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          defaultValue: 'CURRENT_TIMESTAMP()'
        }
      ],
      primaryKeys: ['CUSTOMER_ID'],
      foreignKeys: [],
      indexes: [
        {
          name: 'IDX_CUSTOMERS_NAME',
          columns: ['CUSTOMER_NAME'],
          isUnique: false,
          type: 'CLUSTERED'
        }
      ],
      rowCount: 25000,
      description: 'Customer master data'
    };

    const salesTable: TableMetadata = {
      name: 'SALES',
      schema: 'PUBLIC',
      type: 'table',
      columns: [
        {
          name: 'SALE_ID',
          dataType: 'NUMBER',
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          constraints: ['PRIMARY KEY', 'IDENTITY'],
          precision: 38,
          scale: 0
        },
        {
          name: 'CUSTOMER_ID',
          dataType: 'NUMBER',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: true,
          constraints: ['NOT NULL', 'FOREIGN KEY'],
          foreignKeyReference: {
            table: 'CUSTOMERS',
            column: 'CUSTOMER_ID'
          },
          precision: 38,
          scale: 0
        },
        {
          name: 'PRODUCT_NAME',
          dataType: 'VARCHAR',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          maxLength: 200
        },
        {
          name: 'QUANTITY',
          dataType: 'NUMBER',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          precision: 10,
          scale: 0
        },
        {
          name: 'UNIT_PRICE',
          dataType: 'NUMBER',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          precision: 10,
          scale: 2
        },
        {
          name: 'SALE_DATE',
          dataType: 'DATE',
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          constraints: ['NOT NULL'],
          defaultValue: 'CURRENT_DATE()'
        }
      ],
      primaryKeys: ['SALE_ID'],
      foreignKeys: [
        {
          name: 'FK_SALES_CUSTOMER',
          columns: ['CUSTOMER_ID'],
          referencedTable: 'CUSTOMERS',
          referencedColumns: ['CUSTOMER_ID'],
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        }
      ],
      indexes: [
        {
          name: 'IDX_SALES_CUSTOMER',
          columns: ['CUSTOMER_ID'],
          isUnique: false,
          type: 'CLUSTERED'
        },
        {
          name: 'IDX_SALES_DATE',
          columns: ['SALE_DATE'],
          isUnique: false,
          type: 'CLUSTERED'
        }
      ],
      rowCount: 125000,
      description: 'Sales transactions table'
    };

    return {
      version: version,
      lastUpdated: baseTimestamp,
      tables: [customersTable, salesTable],
      relationships: [
        {
          type: 'one-to-many',
          fromTable: 'CUSTOMERS',
          fromColumns: ['CUSTOMER_ID'],
          toTable: 'SALES',
          toColumns: ['CUSTOMER_ID'],
          constraintName: 'FK_SALES_CUSTOMER'
        }
      ],
      schemas: ['PUBLIC'],
      totalTables: 2,
      totalColumns: 10
    };
  } else {
    // Fallback empty schema
    return {
      version: version,
      lastUpdated: baseTimestamp,
      tables: [],
      relationships: [],
      schemas: [],
      totalTables: 0,
      totalColumns: 0
    };
  }
}

/**
 * API route handler for database schema metadata
 * Fetches schema information including tables, columns, and relationships
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize('schema:read');
    if (!auth.ok) return auth.response;
    // Get target from query parameters
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');

    // Validate target parameter
    if (!target) {
      return NextResponse.json(
        createErrorResponse(
          'Missing required parameter: target is required',
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    if (!['sqlalchemy', 'snowflake'].includes(target)) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid target: must be either "sqlalchemy" or "snowflake"',
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${target}`;
    const cachedEntry = schemaCache[cacheKey];
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
      return NextResponse.json(
        createSuccessResponse(cachedEntry.data, {
          cached: true,
          timestamp: cachedEntry.timestamp
        })
      );
    }

    // For now, simulate database introspection with mock data
    // In production, this would connect to the actual MCP-DB Connector server
    let schemaMetadata: SchemaMetadata;

    try {
      // Try to fetch from MCP server first
      const mcpResponse = await fetch('http://localhost:8000/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: target,
          action: 'introspect'
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (mcpResponse.ok) {
        const mcpData = await mcpResponse.json();

        // Transform MCP response to our schema format
        schemaMetadata = {
          version: mcpData.version || '1.0.0',
          lastUpdated: new Date().toISOString(),
          tables: mcpData.tables || [],
          relationships: mcpData.relationships || [],
          schemas: mcpData.schemas || ['public'],
          totalTables: mcpData.totalTables || (mcpData.tables || []).length,
          totalColumns: mcpData.totalColumns || 0
        };
      } else {
        throw new Error('MCP server responded with non-200 status');
      }
    } catch {
      // Fallback to mock data for development/demo purposes when MCP server is unavailable
      schemaMetadata = generateMockSchemaData(target);
    }

    // Cache the result
    schemaCache[cacheKey] = {
      data: schemaMetadata,
      timestamp: now,
      version: schemaMetadata.version
    };

    return NextResponse.json(
      createSuccessResponse(schemaMetadata, {
        cached: false,
        timestamp: now
      })
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'INTERNAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to refresh schema cache for a specific target
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorize('schema:manage');
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const { target, action } = body;

    if (!target) {
      return NextResponse.json(
        createErrorResponse(
          'Missing required field: target is required',
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    if (!['sqlalchemy', 'snowflake'].includes(target)) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid target: must be either "sqlalchemy" or "snowflake"',
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    // Handle cache refresh action
    if (action === 'refresh') {
      const cacheKey = `${target}`;
      delete schemaCache[cacheKey];

      return NextResponse.json(
        createSuccessResponse({ message: `Schema cache cleared for ${target}` })
      );
    }

    // Handle schema version check
    if (action === 'version') {
      const cacheKey = `${target}`;
      const cachedEntry = schemaCache[cacheKey];

      return NextResponse.json(
        createSuccessResponse(
          {
            version: cachedEntry?.version || null,
            lastUpdated: cachedEntry?.data.lastUpdated || null
          },
          {
            cached: !!cachedEntry
          }
        )
      );
    }

    return NextResponse.json(
      createErrorResponse(
        'Invalid action: must be either "refresh" or "version"',
        'VALIDATION_ERROR'
      ),
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'INTERNAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

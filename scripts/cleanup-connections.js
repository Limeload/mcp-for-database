#!/usr/bin/env node

/**
 * Connection Pool Cleanup Script (TypeScript)
 * Run with: npm run db:pool:cleanup
 */

interface CleanupResult {
  success: boolean;
  cleanedConnections: number;
  message: string;
}

interface McpResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  error?: string;
}

async function cleanupConnections(): Promise<void> {
  try {
    console.log('🧹 Starting connection pool cleanup...');
    
    const response = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'cleanup_idle_connections',
          arguments: {}
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const result: McpResponse = await response.json();
    
    if (result.error) {
      throw new Error(`MCP error: ${result.error}`);
    }

    if (!result.content || result.content.length === 0) {
      throw new Error('Invalid response format from MCP server');
    }

    const cleanupResult: CleanupResult = JSON.parse(result.content[0].text);
    
    console.log('\n🧹 Connection Pool Cleanup Results');
    console.log('==================================');
    
    if (cleanupResult.success) {
      console.log(`✅ Successfully cleaned up ${cleanupResult.cleanedConnections} idle connections`);
      
      if (cleanupResult.cleanedConnections === 0) {
        console.log('💡 No idle connections found to cleanup');
      } else if (cleanupResult.cleanedConnections === 1) {
        console.log('🎯 1 connection was idle and has been cleaned up');
      } else {
        console.log(`🎯 ${cleanupResult.cleanedConnections} connections were idle and have been cleaned up`);
      }
    } else {
      console.log(`❌ Cleanup failed: ${cleanupResult.message || 'Unknown error'}`);
    }
    
    console.log('');
    console.log(`⏰ Cleanup completed at: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('\n❌ Error during connection cleanup:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error('   Unknown error occurred');
    }
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('   - Make sure the development server is running on http://localhost:3000');
    console.log('   - Verify the MCP server is properly configured');
    console.log('   - Check if the cleanup_idle_connections tool is available');
    
    process.exit(1);
  }
}

// Get current stats before and after cleanup
async function cleanupWithStats(): Promise<void> {
  try {
    // Get stats before cleanup
    console.log('📊 Getting connection stats before cleanup...');
    const statsBefore = await fetch('http://localhost:3000/api/db/query', {
      method: 'GET'
    });
    
    if (statsBefore.ok) {
      const beforeData = await statsBefore.json();
      console.log(`   Total connections before: ${beforeData.totalConnections}`);
      console.log(`   Idle connections before: ${beforeData.idleConnections}`);
    }
    
    // Perform cleanup
    await cleanupConnections();
    
    // Get stats after cleanup
    console.log('📊 Getting connection stats after cleanup...');
    const statsAfter = await fetch('http://localhost:3000/api/db/query', {
      method: 'GET'
    });
    
    if (statsAfter.ok) {
      const afterData = await statsAfter.json();
      console.log(`   Total connections after: ${afterData.totalConnections}`);
      console.log(`   Idle connections after: ${afterData.idleConnections}`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup with stats:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Main execution with command line argument support
if (require.main === module) {
  const args = process.argv.slice(2);
  const withStats = args.includes('--with-stats') || args.includes('-s');
  
  if (withStats) {
    cleanupWithStats().catch((error) => {
      console.error('❌ Failed to cleanup connections with stats:', error);
      process.exit(1);
    });
  } else {
    cleanupConnections().catch((error) => {
      console.error('❌ Failed to cleanup connections:', error);
      process.exit(1);
    });
  }
}

export { cleanupConnections, cleanupWithStats };

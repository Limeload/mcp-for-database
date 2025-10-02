#!/usr/bin/env node

/**
 * Connection Pool Statistics Script (TypeScript)
 * Run with: npm run db:pool:stats
 */

interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  connectionsByTarget: Record<string, number>;
  averageQueryTime: number;
  totalQueries: number;
}

async function getConnectionStats(): Promise<void> {
  try {
    const response = await fetch('http://localhost:3000/api/db/query', {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const stats: ConnectionStats = await response.json();
    
    console.log('\n📊 Database Connection Pool Statistics');
    console.log('=====================================');
    console.log(`Total Connections: ${stats.totalConnections}`);
    console.log(`Active Connections: ${stats.activeConnections}`);
    console.log(`Idle Connections: ${stats.idleConnections}`);
    console.log(`Total Queries: ${stats.totalQueries}`);
    console.log(`Average Query Time: ${stats.averageQueryTime.toFixed(2)}ms`);
    
    console.log('\nConnections by Target:');
    if (Object.keys(stats.connectionsByTarget).length > 0) {
      Object.entries(stats.connectionsByTarget).forEach(([target, count]) => {
        console.log(`  ${target}: ${count}`);
      });
    } else {
      console.log('  No active connections');
    }
    
    console.log('');
    console.log(`⏰ Retrieved at: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Error fetching connection stats:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error('   Unknown error occurred');
    }
    
    console.log('\n💡 Make sure the development server is running on http://localhost:3000');
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

// Main execution
if (require.main === module) {
  getConnectionStats().catch((error) => {
    console.error('❌ Failed to get connection stats:', error);
    process.exit(1);
  });
}

export { getConnectionStats };

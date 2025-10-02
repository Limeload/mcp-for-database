#!/usr/bin/env node

/**
 * Connection Pool Statistics Script
 * Run with: npm run db:pool:stats
 */

const fetch = require('node-fetch');

async function getConnectionStats() {
  try {
    const response = await fetch('http://localhost:3000/api/db/query', {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const stats = await response.json();

    console.log('\n📊 Database Connection Pool Statistics');
    console.log('=====================================');
    console.log(`Total Connections: ${stats.totalConnections}`);
    console.log(`Active Connections: ${stats.activeConnections}`);
    console.log(`Idle Connections: ${stats.idleConnections}`);
    console.log(`Total Queries: ${stats.totalQueries}`);
    console.log(`Average Query Time: ${stats.averageQueryTime.toFixed(2)}ms`);
    console.log('\nConnections by Target:');
    Object.entries(stats.connectionsByTarget).forEach(([target, count]) => {
      console.log(`  ${target}: ${count}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error fetching connection stats:', error.message);
    process.exit(1);
  }
}

getConnectionStats();

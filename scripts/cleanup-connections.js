#!/usr/bin/env node

/**
 * Connection Pool Cleanup Script
 * Run with: npm run db:pool:cleanup
 */

const fetch = require('node-fetch');

async function cleanupConnections() {
  try {
    const response = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'cleanup_idle_connections',
          arguments: {}
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const cleanupResult = JSON.parse(result.content[0].text);

    console.log('\n🧹 Connection Pool Cleanup');
    console.log('==========================');
    console.log(
      `✅ Cleaned up ${cleanupResult.cleanedConnections} idle connections`
    );
    console.log('');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanupConnections();

#!/usr/bin/env node

/**
 * Credential Encryption Key Generator
 * 
 * This script generates a secure 256-bit encryption key for the credential management system.
 * Run this script to generate a new key for production use.
 * 
 * Usage:
 *   node scripts/generate-encryption-key.js
 *   node scripts/generate-encryption-key.js --format=hex
 *   node scripts/generate-encryption-key.js --format=base64
 */

const crypto = require('crypto');

const format = process.argv.includes('--format=hex') ? 'hex' : 
               process.argv.includes('--format=base64') ? 'base64' : 'base64';

function generateEncryptionKey() {
  const key = crypto.randomBytes(32); // 256 bits
  
  switch (format) {
    case 'hex':
      return key.toString('hex');
    case 'base64':
      return key.toString('base64');
    default:
      return key.toString('base64');
  }
}

function main() {
  console.log('🔐 Database Credential Encryption Key Generator\n');
  
  const key = generateEncryptionKey();
  
  console.log('Generated encryption key:');
  console.log('─'.repeat(50));
  console.log(key);
  console.log('─'.repeat(50));
  
  console.log('\n📋 Next steps:');
  console.log('1. Copy the key above');
  console.log('2. Add it to your .env.local file:');
  console.log(`   CREDENTIAL_ENCRYPTION_KEY=${key}`);
  console.log('3. Restart your application');
  console.log('4. Never commit this key to version control!');
  
  console.log('\n⚠️  Security reminders:');
  console.log('• Store this key securely (password manager, secure vault)');
  console.log('• Use different keys for different environments');
  console.log('• Rotate keys regularly in production');
  console.log('• Never share keys in plain text');
  
  console.log('\n🔧 Validation:');
  console.log('You can test the key by running:');
  console.log('   node -e "console.log(require(\'./app/lib/database/encryption\').validateEncryptionKey())"');
}

if (require.main === module) {
  main();
}

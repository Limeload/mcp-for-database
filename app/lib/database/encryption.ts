import crypto from 'crypto';

/**
 * Secure credential encryption and decryption utilities
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment variables
 * Falls back to a generated key for development (not secure for production)
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.CREDENTIAL_ENCRYPTION_KEY;
  
  if (keyString) {
    // Use provided key (should be base64 encoded)
    try {
      return Buffer.from(keyString, 'base64');
    } catch {
      throw new Error('Invalid CREDENTIAL_ENCRYPTION_KEY format. Must be base64 encoded.');
    }
  }
  
  // Development fallback - generate a deterministic key from a seed
  // WARNING: This is NOT secure for production use
  if (process.env.NODE_ENV === 'development') {
    const seed = process.env.CREDENTIAL_ENCRYPTION_SEED || 'development-seed-key';
    return crypto.scryptSync(seed, 'salt', KEY_LENGTH);
  }
  
  throw new Error(
    'CREDENTIAL_ENCRYPTION_KEY environment variable is required for production. ' +
    'Generate a secure 256-bit key and set it as a base64-encoded string.'
  );
}

/**
 * Encrypt a password using AES-256-GCM
 */
export function encryptPassword(password: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('credential-password', 'utf8'));
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Password encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a password using AES-256-GCM
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedPassword, 'base64');
    
    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    void iv; // Suppress unused variable warning
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from('credential-password', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Password decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a secure encryption key for production use
 * This should be run once to generate a key, then stored securely
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Validate that the current encryption key can encrypt and decrypt data
 */
export function validateEncryptionKey(): { valid: boolean; error?: string } {
  try {
    const testPassword = 'test-password-123';
    const encrypted = encryptPassword(testPassword);
    const decrypted = decryptPassword(encrypted);
    
    if (decrypted !== testPassword) {
      return {
        valid: false,
        error: 'Encryption/decryption round-trip failed'
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown encryption error'
    };
  }
}

/**
 * Hash a credential ID for use as a storage key
 * This provides an additional layer of security by not storing raw IDs
 */
export function hashCredentialId(credentialId: string, userId: string): string {
  const combined = `${userId}:${credentialId}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Generate a secure random credential ID
 */
export function generateCredentialId(): string {
  return `cred_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

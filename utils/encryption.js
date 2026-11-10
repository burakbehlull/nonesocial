import crypto from 'crypto';

// Encryption key - 32 bytes for AES-256
const ENCRYPTION_KEY = (() => {
  if (process.env.IP_ENCRYPTION_KEY) {
    // Eğer hex string ise (64 karakter)
    if (process.env.IP_ENCRYPTION_KEY.length === 64) {
      return Buffer.from(process.env.IP_ENCRYPTION_KEY, 'hex');
    }
    // Eğer text string ise, SHA-256 ile 32 byte'a çevir
    return crypto.createHash('sha256')
      .update(process.env.IP_ENCRYPTION_KEY)
      .digest();
  }
  // Fallback: random key (development için)
  return crypto.randomBytes(32);
})();

const IV_LENGTH = 16; // AES block size

/**
 * Encrypt IP address (reversible)
 * @param {string} ip - IP address to encrypt
 * @returns {string} - Encrypted IP in format: iv:encryptedData
 */
export function encryptIP(ip) {
  try {
    if (!ip) return null;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(ip, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return format: iv:encryptedData (both hex)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('IP encryption error:', error);
    return null;
  }
}

/**
 * Decrypt IP address
 * @param {string} encryptedIP - Encrypted IP in format: iv:encryptedData
 * @returns {string|null} - Decrypted IP address or null if error
 */
export function decryptIP(encryptedIP) {
  try {
    if (!encryptedIP || !encryptedIP.includes(':')) {
      return null;
    }

    const parts = encryptedIP.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('IP decryption error:', error);
    return null;
  }
}

/**
 * Hash IP address (non-reversible, for comparison)
 * @param {string} ip - IP address to hash
 * @returns {string} - SHA256 hash
 */
export function hashIP(ip) {
  const salt = process.env.IP_SALT || 'none-social-secret-salt-2024';
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex');
}

export default {
  encryptIP,
  decryptIP,
  hashIP
};

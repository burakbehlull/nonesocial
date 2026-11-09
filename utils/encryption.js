import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.IP_ENCRYPTION_KEY || crypto.randomBytes(32); // 32 bytes for AES-256
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt IP address (reversible)
 * @param {string} ip - IP address to encrypt
 * @returns {string} - Encrypted IP in format: iv:encryptedData
 */
export function encryptIP(ip) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(ip);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Return format: iv:encryptedData (both base64)
    return iv.toString('hex') + ':' + encrypted.toString('hex');
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
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
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
  const salt = process.env.IP_SALT || 'default-salt';
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

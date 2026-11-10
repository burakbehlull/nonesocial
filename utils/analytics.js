import crypto from 'crypto';
import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';
import { encryptIP } from './encryption.js';

// IP'yi hash'le (GDPR uyumluluğu için)
export const hashIP = (ip) => {
  const salt = process.env.IP_SALT || 'none-social-secret-salt-2024';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
};

// IP'den konum bilgisi al
export const getLocationFromIP = (ip) => {
  try {
    // Localhost kontrolü
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127')) {
      return {
        country: 'Local',
        city: 'Localhost',
        timezone: 'UTC',
        coordinates: { lat: 0, lng: 0 }
      };
    }

    const geo = geoip.lookup(ip);
    
    if (!geo) {
      return {
        country: 'Unknown',
        city: 'Unknown',
        timezone: 'UTC',
        coordinates: { lat: 0, lng: 0 }
      };
    }

    return {
      country: geo.country || 'Unknown',
      city: geo.city || 'Unknown',
      timezone: geo.timezone || 'UTC',
      coordinates: {
        lat: geo.ll?.[0] || 0,
        lng: geo.ll?.[1] || 0
      }
    };
  } catch (error) {
    console.error('Location lookup error:', error);
    return {
      country: 'Unknown',
      city: 'Unknown',
      timezone: 'UTC',
      coordinates: { lat: 0, lng: 0 }
    };
  }
};

// User Agent'tan tarayıcı bilgisi al
export const parseBrowserInfo = (userAgent) => {
  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || 'Unknown',
      os: result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : 'Unknown',
      device: result.device.type || 'desktop', // mobile, tablet, desktop
      userAgent: userAgent.slice(0, 255) // Limit length
    };
  } catch (error) {
    console.error('Browser parse error:', error);
    return {
      name: 'Unknown',
      version: 'Unknown',
      os: 'Unknown',
      device: 'desktop',
      userAgent: userAgent.slice(0, 255)
    };
  }
};

// Socket'ten IP al
export const getSocketIP = (socket) => {
  return socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() ||
         socket.handshake.address ||
         socket.conn.remoteAddress ||
         '127.0.0.1';
};

// Re-export encryption functions
export { encryptIP } from './encryption.js';

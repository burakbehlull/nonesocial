import winston from 'winston';

// Custom format for better readability
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  
  // Handle message
  if (typeof message === 'object') {
    msg += `\n${JSON.stringify(message, null, 2)}`;
  } else {
    msg += `: ${message}`;
  }
  
  // Handle additional metadata
  const metaKeys = Object.keys(metadata);
  if (metaKeys.length > 0) {
    // Remove internal winston fields
    const cleanMeta = { ...metadata };
    delete cleanMeta.level;
    delete cleanMeta.message;
    delete cleanMeta.timestamp;
    delete cleanMeta[Symbol.for('level')];
    delete cleanMeta[Symbol.for('message')];
    delete cleanMeta[Symbol.for('splat')];
    
    if (Object.keys(cleanMeta).length > 0) {
      msg += `\n${JSON.stringify(cleanMeta, null, 2)}`;
    }
  }
  
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Console logging in development with custom format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customFormat
    )
  }));
}

export default logger;

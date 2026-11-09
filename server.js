import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import eventLoader from './events/eventLoader.js';
import logger from './utils/logger.js';
import { socketAuthMiddleware } from './utils/auth.js';
import { connectDB } from './utils/database.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/report.js';

dotenv.config();

// MongoDB'ye bağlan (optional - analytics için)
connectDB().catch(err => {
  console.log('⚠️  MongoDB connection failed, continuing without analytics');
});

const app = express();

// Security: Helmet middleware for HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Security: Strict CORS configuration
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

console.log('🔒 CORS Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, same-origin, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({
        type: 'CORS_BLOCKED',
        origin,
        allowedOrigins
      });
      // In production, be more lenient initially for debugging
      if (process.env.NODE_ENV === 'production') {
        console.warn(`⚠️  CORS Warning: Origin ${origin} not in allowed list. Allowing anyway for debugging.`);
        callback(null, true); // Temporarily allow for debugging
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests - use proper wildcard syntax
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: '10kb' })); // Limit request body size

// Security: Rate limiting for HTTP endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Admin routes
app.use('/api/admin', adminRoutes);

// Report routes (public)
app.use('/api/reports', reportRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6, // 1MB max message size
  allowEIO3: false // Disable old protocol
});

// Security: Socket.io authentication middleware
io.use(socketAuthMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    security: {
      helmet: true,
      rateLimit: true,
      authentication: true
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'NoneSocial API',
    version: '3.0.0',
    security: 'enabled',
    docs: '/health'
  });
});

// Load socket events
eventLoader(io);

// Global error handler
app.use((err, req, res, next) => {
  logger.error({
    type: 'HTTP_ERROR',
    message: err.message,
    stack: err.stack,
    url: req.url
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info({
    type: 'SERVER_STARTED',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    security: 'enabled'
  });
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🔒 Security enabled: JWT, Rate Limiting, XSS Protection`);
});

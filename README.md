# NoneSocial - Secure Anonymous Video Chat

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Security](https://img.shields.io/badge/security-enabled-green)
![License](https://img.shields.io/badge/license-MIT-blue)

Discord-style anonymous WebRTC video chat application with **enterprise-grade security**.

## 🔒 Security Features

✅ **JWT Authentication** - Persistent user IDs across sessions  
✅ **XSS Protection** - All inputs sanitized with DOMPurify  
✅ **Rate Limiting** - Prevent spam and DoS attacks  
✅ **Password Hashing** - bcrypt for room passwords  
✅ **WebRTC Security** - Validated signaling, room-based authorization  
✅ **Input Validation** - Joi schemas for all events  
✅ **CORS Hardening** - Strict origin whitelist  
✅ **Helmet Security Headers** - CSP, HSTS, XSS protection  
✅ **Logging & Monitoring** - Winston for security events  
✅ **Auto Room Cleanup** - Expire rooms after 24 hours  

**See [SECURITY.md](./SECURITY.md) for detailed documentation.**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install**
   ```bash
   cd main
   npm install
   ```

2. **Generate JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and paste your JWT secret
   ```

4. **Start Backend**
   ```bash
   npm start
   # or
   node server.js
   ```

5. **Start Frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 📁 Project Structure

```
main/
├── server.js                 # Main server (with Helmet, CORS, Rate Limiting)
├── events/
│   ├── eventLoader.js       # Event loader
│   └── room.js              # Secure room events (JWT, bcrypt, validation)
├── utils/
│   ├── auth.js              # JWT authentication
│   ├── sanitizer.js         # XSS protection
│   ├── validation.js        # Joi schemas
│   ├── rateLimiter.js       # Rate limiting
│   └── logger.js            # Winston logging
├── logs/                     # Security logs (auto-generated)
├── client/                   # React frontend
├── .env                      # Environment variables (SECRET!)
├── .env.example             # Example configuration
└── SECURITY.md              # Security documentation
```

## 🔐 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Client URL (comma-separated for multiple origins)
CLIENT_URL=http://localhost:5173

# Security (REQUIRED!)
JWT_SECRET=your_super_secret_256_bit_random_string_here

# Logging
LOG_LEVEL=info
```

⚠️ **IMPORTANT:** Change `JWT_SECRET` before deploying to production!

## 🛡️ Security Implementation

### 1. Authentication Flow
```javascript
// Client connects → Server generates JWT → Client stores token
// Client reconnects → Sends token → Server verifies → Restored session
```

### 2. Rate Limits
- **Messages:** 10/second
- **Room Creation:** 5/hour
- **Room Joining:** 20/minute
- **Name Changes:** 5/minute
- **WebRTC Signals:** 50/10 seconds

### 3. Input Sanitization
```javascript
// Before: "<script>alert('XSS')</script>"
// After:  "&lt;script&gt;alert('XSS')&lt;/script&gt;"
```

### 4. Password Security
```javascript
// Stored: $2b$10$rH3.bKq8... (bcrypt hash)
// Never stored in plaintext
```

### 5. WebRTC Signaling Validation
```javascript
// ✅ Both users in same room
// ✅ Room exists
// ✅ Users are members
// ✅ Rate limited
// ❌ Cannot signal to users outside room
```

## 📊 Monitoring

Check security logs:
```bash
tail -f logs/error.log      # Errors and security violations
tail -f logs/combined.log   # All events
```

Key events to monitor:
- `XSS_ATTEMPT` - Blocked XSS injection
- `RATE_LIMIT_EXCEEDED` - Users hitting limits
- `AUTH_FAILED` - Invalid tokens
- `WEBRTC_UNAUTHORIZED` - Unauthorized signaling
- `CORS_BLOCKED` - Blocked origins

## 🐛 Troubleshooting

### PowerShell Execution Policy Error
```powershell
# Option 1: Use CMD instead of PowerShell
cmd
npm start

# Option 2: Use node directly
node server.js

# Option 3: Bypass for current session (not recommended)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm start
```

### WebSocket Connection Failed
1. Ensure backend is running on port 3000
2. Check `VITE_SERVER_URL` in `client/.env`
3. Verify CORS settings in `main/.env`

### Authentication Errors
1. Clear browser localStorage
2. Verify JWT_SECRET is set in `.env`
3. Check server logs for errors

## 🚀 Production Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables:
   ```env
   NODE_ENV=production
   JWT_SECRET=<strong-random-secret>
   CLIENT_URL=https://yourdomain.com
   PORT=3000
   ```

2. Deploy from `main/` directory

3. Ensure build command: `npm install`

4. Ensure start command: `npm start` or `node server.js`

### Frontend (Vercel/Netlify)
1. Set environment variable:
   ```env
   VITE_SERVER_URL=https://your-backend.onrender.com
   ```

2. Deploy from `main/client/` directory

3. Build command: `npm run build`

4. Output directory: `dist`

## 📦 Dependencies

### Security
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `helmet` - HTTP security headers
- `isomorphic-dompurify` - XSS sanitization
- `validator` - Input validation
- `joi` - Schema validation
- `winston` - Security logging
- `express-rate-limit` - Rate limiting

### Core
- `express` - Web framework
- `socket.io` - WebSocket
- `cors` - CORS handling
- `nanoid` - ID generation

## 🔍 API Changes from v2.0

### User IDs
```javascript
// OLD (v2.0): socket.id based (temporary)
room.members[socket.id] = { name: 'Guest' }

// NEW (v3.0): userId based (persistent)
room.members[socket.userId] = { name: 'Guest' }
```

### Kick User
```javascript
// OLD
socket.emit('kickUser', { roomId, targetSocketId })

// NEW
socket.emit('kickUser', { roomId, targetUserId })
```

### Error Handling
```javascript
// Listen for errors
socket.on('error', (error) => {
  console.error('Server error:', error.message)
})

// Handle kicks
socket.on('kicked', ({ roomId, reason }) => {
  alert(`Kicked: ${reason}`)
})
```

## 📝 Changelog

### v3.0.0 (2024) - Security Update
- ✅ JWT authentication system
- ✅ XSS protection (DOMPurify)
- ✅ Rate limiting (all events)
- ✅ Password hashing (bcrypt)
- ✅ WebRTC signaling security
- ✅ Input validation (Joi)
- ✅ Security headers (Helmet)
- ✅ CORS hardening
- ✅ Comprehensive logging (Winston)
- ✅ Auto room cleanup

### v2.0.0
- Native WebRTC implementation
- Discord-style UI
- Message grouping

### v1.0.0
- Initial release

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

**Security vulnerabilities:** Please report privately to security@yourdomain.com

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

**Burak Behlül** ([@burakbehlull](https://github.com/burakbehlull))

## 🙏 Acknowledgments

- WebRTC API
- Socket.io
- React + Vite
- Chakra UI
- All security library maintainers

---

**⚠️ SECURITY REMINDER:**
- Never commit `.env` file
- Change JWT_SECRET in production
- Monitor logs regularly
- Keep dependencies updated
- Review [SECURITY.md](./SECURITY.md)

Made with ❤️ and 🔒

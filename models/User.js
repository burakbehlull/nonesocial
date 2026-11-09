import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Kullanıcı Bilgileri
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // IP Adresi (GDPR için hash'lenmiş)
  ipHash: {
    type: String,
    required: true
  },
  
  // Konum Bilgisi
  location: {
    country: String,
    city: String,
    timezone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Tarayıcı Bilgisi
  browser: {
    name: String,      // Chrome, Firefox, Safari
    version: String,   // 120.0.0
    os: String,        // Windows 11, macOS 14
    device: String,    // desktop, mobile, tablet
    userAgent: String  // Full user agent
  },
  
  // İstatistikler
  stats: {
    totalRooms: { type: Number, default: 0 },        // Toplam katıldığı oda sayısı
    totalMessages: { type: Number, default: 0 },     // Toplam mesaj sayısı
    totalCallMinutes: { type: Number, default: 0 },  // Toplam çağrı süresi (dakika)
    roomsCreated: { type: Number, default: 0 },      // Oluşturduğu oda sayısı
    roomsJoined: { type: Number, default: 0 },       // Katıldığı oda sayısı
    lastActive: { type: Date, default: Date.now }
  },
  
  // Ban Bilgisi
  banned: {
    isBanned: { type: Boolean, default: false },
    bannedAt: Date,
    bannedReason: String,
    bannedUntil: Date,
    bannedBy: String
  },
  
  // Kayıt ve Son Görülme
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  
  // TTL için (90 gün sonra otomatik silinir)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Activity güncelleme metodu
userSchema.methods.updateActivity = function() {
  this.lastSeen = new Date();
  this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 gün uzat
  return this.save();
};

export default mongoose.model('User', userSchema);

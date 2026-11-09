import mongoose from 'mongoose';

const sessionLogSchema = new mongoose.Schema({
  // Session Bilgileri
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  socketId: {
    type: String,
    required: true
  },
  
  // IP ve Konum
  ipHash: {
    type: String,
    required: true
  },
  
  // Tarayıcı Bilgisi
  browser: {
    name: String,
    version: String,
    os: String,
    device: String,
    userAgent: String
  },
  
  // Konum
  location: {
    country: String,
    city: String,
    timezone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Ziyaret Edilen Odalar
  roomsVisited: [{
    roomId: String,
    joinedAt: Date,
    leftAt: Date,
    duration: Number // Saniye
  }],
  
  // Olaylar (Events)
  events: [{
    type: {
      type: String,
      enum: ['connect', 'disconnect', 'join_room', 'leave_room', 'send_message', 'join_call', 'leave_call', 'kicked', 'banned']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed // Ekstra veri
  }],
  
  // Session İstatistikleri
  stats: {
    messagesCount: { type: Number, default: 0 },
    callMinutes: { type: Number, default: 0 },
    roomsJoined: { type: Number, default: 0 }
  },
  
  // Bağlantı Zamanları
  connectedAt: {
    type: Date,
    default: Date.now
  },
  
  disconnectedAt: Date,
  
  duration: Number, // Saniye cinsinden toplam session süresi
  
  // TTL için (7 gün sonra otomatik silinir)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Event ekleme metodu
sessionLogSchema.methods.addEvent = function(type, data = {}) {
  this.events.push({
    type,
    timestamp: new Date(),
    data
  });
  return this.save();
};

export default mongoose.model('SessionLog', sessionLogSchema);

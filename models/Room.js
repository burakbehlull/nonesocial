import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  name: String,
  role: {
    type: String,
    enum: ['owner', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: Date,
  duration: Number, // Saniye cinsinden
  messageCount: { type: Number, default: 0 },
  callDuration: { type: Number, default: 0 }, // Dakika cinsinden
  ipHash: String,
  browser: {
    name: String,
    os: String,
    device: String
  }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  // Oda Bilgileri
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  hasPassword: {
    type: Boolean,
    default: false
  },
  
  limit: {
    type: Number,
    default: 10
  },
  
  videoEnabled: {
    type: Boolean,
    default: true
  },
  
  // Owner Bilgisi
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Üyeler
  members: [memberSchema],
  
  // İstatistikler
  stats: {
    totalMembers: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    peakMembers: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }, // Saniye
    totalCallMinutes: { type: Number, default: 0 }
  },
  
  // Banlanan Kullanıcılar
  bannedUsers: [{
    userId: String,
    bannedAt: Date,
    bannedBy: String
  }],
  
  // Durum
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  
  createdAt: { type: Date, default: Date.now },
  closedAt: Date,
  
  // TTL için (30 gün sonra otomatik silinir)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Member ekleme metodu
roomSchema.methods.addMember = function(userId, name, ipHash, browser) {
  const existing = this.members.find(m => m.userId === userId && !m.leftAt);
  
  if (existing) {
    // Zaten varsa güncelle
    existing.name = name;
    existing.ipHash = ipHash;
    existing.browser = browser;
  } else {
    // Yeni member ekle
    this.members.push({
      userId,
      name,
      role: userId === this.ownerId ? 'owner' : 'member',
      ipHash,
      browser,
      joinedAt: new Date()
    });
    this.stats.totalMembers += 1;
    
    // Peak members güncelle
    const activeMemberCount = this.members.filter(m => !m.leftAt).length;
    if (activeMemberCount > this.stats.peakMembers) {
      this.stats.peakMembers = activeMemberCount;
    }
  }
  
  return this.save();
};

// Member çıkarma metodu
roomSchema.methods.removeMember = function(userId) {
  const member = this.members.find(m => m.userId === userId && !m.leftAt);
  
  if (member) {
    member.leftAt = new Date();
    member.duration = Math.floor((member.leftAt - member.joinedAt) / 1000);
  }
  
  return this.save();
};

// Mesaj sayısı artırma
roomSchema.methods.incrementMessageCount = function(userId) {
  this.stats.totalMessages += 1;
  
  const member = this.members.find(m => m.userId === userId && !m.leftAt);
  if (member) {
    member.messageCount += 1;
  }
  
  return this.save();
};

export default mongoose.model('Room', roomSchema);

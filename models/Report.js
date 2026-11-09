import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  // Rapor Bilgileri
  category: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate', 'abuse', 'other'],
    required: true
  },
  
  subject: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  
  // İlgili Bilgiler
  roomId: String,
  userId: String, // Rapor edilen kullanıcı
  
  // Raporlayan Bilgisi
  reportedBy: {
    userId: String,
    ipHash: String,
    email: String // Opsiyonel
  },
  
  // Durum
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'rejected'],
    default: 'pending'
  },
  
  // Admin İşlemleri
  reviewedBy: String, // Admin username
  reviewedAt: Date,
  
  adminNotes: String, // Admin notları
  
  // Alınan Aksiyonlar
  actions: [{
    type: {
      type: String,
      enum: ['ban_user', 'delete_room', 'warning', 'no_action']
    },
    performedBy: String,
    performedAt: Date,
    details: String
  }],
  
  // Yanıt (kullanıcıya geri dönüş)
  response: {
    sent: { type: Boolean, default: false },
    sentAt: Date,
    message: String
  },
  
  // Öncelik
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // TTL - 90 gün sonra otomatik silinir
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ category: 1 });
reportSchema.index({ userId: 1 });
reportSchema.index({ roomId: 1 });

export default mongoose.model('Report', reportSchema);

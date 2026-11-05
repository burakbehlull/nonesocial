# NoneChat Video 🎥

Basit, temiz ve kullanışlı anonim video sohbet uygulaması. WebRTC ile gerçek zamanlı görüntülü görüşme.

## ✨ Özellikler

- 🎥 **Video & Ses Görüşmesi** - WebRTC ile peer-to-peer bağlantı
- 💬 **Anlık Mesajlaşma** - Dahili chat sistemi
- 🔒 **Parola Koruması** - Özel odalar oluştur
- 👥 **Grup Görüşmeleri** - Birden fazla kişiyle konuş
- 🚫 **Veri Saklanmaz** - Tamamen geçici, hiçbir kayıt yok
- 📱 **Responsive** - Mobil ve masaüstü uyumlu

## 🚀 Kurulum

### Backend

```bash
npm install
npm run dev
```

Server: http://localhost:3000

### Frontend

```bash
cd client
npm install  
npm run dev
```

Client: http://localhost:5173

## 📦 Teknolojiler

**Backend:**
- Express.js
- Socket.io
- nanoid

**Frontend:**
- React 18 + Vite
- Simple-Peer (WebRTC)
- Zustand
- React Router
- React Hot Toast

## 🔧 Environment Variables

**Backend (.env):**
```env
PORT=3000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (client/.env):**
```env
VITE_SERVER_URL=http://localhost:3000
```

## 📖 Kullanım

1. Ana sayfadan "Yeni Oda" ile oda oluştur
2. Oda ID'sini paylaş
3. Kamera/mikrofon izni ver
4. Sohbet et!

## 🌐 Deployment

Detaylı deployment rehberi için `DEPLOYMENT.md` dosyasına bakın.

**Önemli:** Production'da TURN sunucusu kullanmayı unutma!

## 📝 Notlar

- Tüm veriler geçicidir
- Mesaj geçmişi saklanmaz
- Kullanıcı bilgileri kalıcı değildir
- Son kullanıcı çıkınca oda otomatik silinir

## 👨‍💻 Geliştirici

Burak [@burakbehlull](https://github.com/burakbehlull)

# None Video Chat - Frontend

React + Vite ile geliştirilmiş WebRTC video chat uygulaması.

## Kurulum

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Özellikler

- React 18
- Vite (hızlı build)
- WebRTC (Simple-Peer)
- Socket.io Client
- Zustand (state management)
- React Router
- React Hot Toast (notifications)
- React Icons

## Klasör Yapısı

```
src/
├── components/     # UI componentleri
├── pages/          # Sayfalar (Home, Room, NotFound)
├── hooks/          # Custom hooks (useWebRTC)
├── services/       # Socket servisi
├── store/          # Zustand store
├── utils/          # Helper fonksiyonlar
└── App.jsx         # Ana component
```

## Environment Variables

```env
VITE_SERVER_URL=http://localhost:3000
```

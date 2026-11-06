import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@services/socket';

// Basit STUN config - direkt P2P bağlantı için
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

export const useWebRTC = (roomId) => {
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [users, setUsers] = useState([]);
  
  const peerConnections = useRef({});
  const socket = useRef(null);
  const localStreamRef = useRef(null);

  // Mikrofon/kamera aç
  const initializeMedia = useCallback(async (includeVideo = false) => {
    try {
      console.log('🎤 Media izni isteniyor...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: includeVideo
      });
      
      console.log('✅ Media erişimi verildi');
      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioEnabled(true);
      setVideoEnabled(includeVideo);
      
      return stream;
    } catch (error) {
      console.error('❌ Media hatası:', error);
      throw error;
    }
  }, []);

  // Peer bağlantısı oluştur (direkt kullanıcılar arası)
  const createPeerConnection = useCallback((userId) => {
    console.log('🔗 Peer bağlantısı oluşturuluyor:', userId);

    if (peerConnections.current[userId]) {
      console.log('⚠️ Zaten var:', userId);
      return peerConnections.current[userId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Local stream'i ekle (mikrofon/kamera)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
        console.log('➕ Track eklendi:', track.kind);
      });
    }

    // Karşı taraftan gelen stream'i yakala
    pc.ontrack = (event) => {
      console.log('📺 Stream geldi:', userId);
      setPeers(prev => ({
        ...prev,
        [userId]: { pc, stream: event.streams[0] }
      }));
    };

    // ICE candidate (NAT geçiş bilgisi) - Socket.io ile gönder
    pc.onicecandidate = (event) => {
      if (event.candidate && socket.current) {
        console.log('🧊 ICE gönderiliyor:', userId);
        socket.current.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate,
          roomId
        });
      }
    };

    // Bağlantı durumu
    pc.onconnectionstatechange = () => {
      console.log(`🔌 ${userId} durumu:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        removePeerConnection(userId);
      }
    };

    peerConnections.current[userId] = pc;
    return pc;
  }, [roomId]);

  // Peer bağlantısını kapat
  const removePeerConnection = useCallback((userId) => {
    console.log('🗑️ Peer kapatılıyor:', userId);
    
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
    
    setPeers(prev => {
      const newPeers = { ...prev };
      delete newPeers[userId];
      return newPeers;
    });
  }, []);

  // Mikrofonu aç/kapat
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        console.log('🎤', audioTrack.enabled ? 'AÇIK' : 'KAPALI');
      }
    }
  }, []);

  // Kamerayı aç/kapat
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
      console.log('📹', videoTrack.enabled ? 'AÇIK' : 'KAPALI');
    } else {
      try {
        console.log('📹 Kamera izni isteniyor...');
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        const newVideoTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newVideoTrack);
        
        // Tüm peer'lara yeni video track'i gönder
        Object.values(peerConnections.current).forEach(pc => {
          pc.addTrack(newVideoTrack, localStreamRef.current);
        });
        
        setLocalStream(localStreamRef.current);
        setVideoEnabled(true);
        console.log('✅ Kamera açıldı');
      } catch (error) {
        console.error('❌ Kamera hatası:', error);
      }
    }
  }, []);

  // Aramayı bitir
  const endCall = useCallback(() => {
    console.log('📴 Arama sonlandırılıyor...');
    
    // Mikrofon/kamerayı kapat
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Tüm peer bağlantılarını kapat
    Object.keys(peerConnections.current).forEach(userId => {
      peerConnections.current[userId].close();
    });
    
    peerConnections.current = {};
    setPeers({});

    // Sunucuya bildir
    if (socket.current) {
      socket.current.emit('end-call', { roomId });
    }
  }, [roomId]);

  // Socket.io ile signaling (sadece tanışma için)
  useEffect(() => {
    if (!roomId) return;

    socket.current = getSocket();
    console.log('📡 Socket bağlandı');

    // Yeni kullanıcı listeyi aldığında
    socket.current.on('roomUsers', (roomUsers) => {
      console.log('👥 Kullanıcılar:', roomUsers.length);
      setUsers(roomUsers);
      
      // Local stream varsa, yeni kullanıcılara bağlan
      if (localStreamRef.current) {
        roomUsers.forEach(user => {
          if (user.id !== socket.current.id && !peerConnections.current[user.id]) {
            // Offer gönder (bağlantı başlat)
            const pc = createPeerConnection(user.id);
            pc.createOffer()
              .then(offer => pc.setLocalDescription(offer))
              .then(() => {
                console.log('📤 Offer gönderiliyor:', user.id);
                socket.current.emit('webrtc-offer', {
                  to: user.id,
                  offer: pc.localDescription,
                  roomId
                });
              });
          }
        });
      }
    });

    // Offer geldi (biri bağlanmak istiyor)
    socket.current.on('webrtc-offer', async ({ from, offer }) => {
      console.log('📥 Offer geldi:', from);
      
      if (!localStreamRef.current) return;

      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      console.log('📤 Answer gönderiliyor:', from);
      socket.current.emit('webrtc-answer', {
        to: from,
        answer: pc.localDescription
      });
    });

    // Answer geldi (karşı taraf kabul etti)
    socket.current.on('webrtc-answer', async ({ from, answer }) => {
      console.log('📥 Answer geldi:', from);
      
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Bağlantı kuruldu:', from);
      }
    });

    // ICE candidate geldi (NAT geçiş bilgisi)
    socket.current.on('ice-candidate', async ({ from, candidate }) => {
      console.log('🧊 ICE geldi:', from);
      
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Kullanıcı ayrıldı
    socket.current.on('userLeft', ({ userId }) => {
      console.log('👋 Kullanıcı ayrıldı:', userId);
      removePeerConnection(userId);
    });

    socket.current.on('call-ended', ({ from }) => {
      console.log('📴 Arama bitti:', from);
      removePeerConnection(from);
    });

    return () => {
      socket.current?.off('roomUsers');
      socket.current?.off('webrtc-offer');
      socket.current?.off('webrtc-answer');
      socket.current?.off('ice-candidate');
      socket.current?.off('userLeft');
      socket.current?.off('call-ended');
    };
  }, [roomId, createPeerConnection, removePeerConnection]);

  // Local stream hazır olduğunda mevcut kullanıcılara bağlan
  useEffect(() => {
    if (!localStream || !socket.current || users.length === 0) return;

    console.log('🎥 Stream hazır, bağlanılıyor:', users.length);
    
    users.forEach(user => {
      if (user.id !== socket.current.id && !peerConnections.current[user.id]) {
        const pc = createPeerConnection(user.id);
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.current.emit('webrtc-offer', {
              to: user.id,
              offer: pc.localDescription,
              roomId
            });
          });
      }
    });
  }, [localStream, users, createPeerConnection, roomId]);

  return {
    peers,
    localStream,
    audioEnabled,
    videoEnabled,
    users,
    initializeMedia,
    toggleAudio,
    toggleVideo,
    endCall
  };
};

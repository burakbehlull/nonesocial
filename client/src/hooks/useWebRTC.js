import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@services/socket';

// Basit ICE config - direkt P2P için
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
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
  const initializeMedia = useCallback(async (startMuted = false) => {
    try {
      console.log('🎤 Media izni isteniyor... (startMuted:', startMuted, ')');
      
      // HER ZAMAN audio al (video opsiyonel)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false // Kamerayı sadece kullanıcı isterse açacağız
      });
      
      // Eğer muted başlatılacaksa mikrofonu kapat
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !startMuted;
      }
      
      console.log('✅ Media erişimi verildi');
      console.log('  📊 Audio tracks:', stream.getAudioTracks().length);
      console.log('  📊 Audio enabled:', audioTrack?.enabled);
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioEnabled(!startMuted);
      setVideoEnabled(false);
      
      return stream;
    } catch (error) {
      console.error('❌ Media hatası:', error.name, error.message);
      throw error;
    }
  }, []);

  // Peer connection oluştur
  const createPeerConnection = useCallback((userId) => {
    console.log('🔗 Peer connection oluşturuluyor:', userId);

    if (peerConnections.current[userId]) {
      console.log('⚠️ Peer zaten var:', userId);
      return peerConnections.current[userId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Local tracks ekle
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
        console.log('  ➕ Track eklendi:', track.kind, 'enabled:', track.enabled);
      });
    }

    // Remote track geldiğinde
    pc.ontrack = (event) => {
      console.log('📺 Remote track alındı:', event.track.kind, 'from:', userId);
      
      setPeers(prev => ({
        ...prev,
        [userId]: { 
          pc, 
          stream: event.streams[0]
        }
      }));
    };

    // ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socket.current) {
        console.log('🧊 ICE candidate gönderiliyor:', userId);
        socket.current.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate,
          roomId
        });
      }
    };

    // Connection durumu
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`🔌 Connection state [${userId}]:`, state);
      
      if (state === 'connected') {
        console.log('✅ Bağlantı kuruldu:', userId);
      } else if (state === 'failed' || state === 'disconnected') {
        console.log('❌ Bağlantı kesildi:', userId);
        removePeerConnection(userId);
      }
    };

    // ICE connection durumu
    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE state [${userId}]:`, pc.iceConnectionState);
    };

    peerConnections.current[userId] = pc;
    return pc;
  }, [roomId]);

  // Peer connection kapat
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

  // Mikrofon toggle
  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) {
      console.warn('⚠️ Local stream yok!');
      return;
    }
    
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
      console.log('🎤', audioTrack.enabled ? 'AÇIK' : 'KAPALI');
    } else {
      console.error('❌ Audio track bulunamadı!');
    }
  }, []);

  // Kamera toggle
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    
    // Eğer video track yoksa, ilk defa açılıyor demektir
    if (!videoTrack) {
      try {
        console.log('📹 Kamera izni isteniyor...');
        
        // Yeni video stream al
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        const newVideoTrack = videoStream.getVideoTracks()[0];
        
        // Video track'i mevcut stream'e ekle
        localStreamRef.current.addTrack(newVideoTrack);
        
        // Peer connections'a da ekle
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (!sender) {
            pc.addTrack(newVideoTrack, localStreamRef.current);
            console.log('  ➕ Video track peer\'e eklendi');
          }
        });
        
        setVideoEnabled(true);
        setLocalStream(localStreamRef.current);
        console.log('✅ Kamera açıldı');
      } catch (error) {
        console.error('❌ Kamera hatası:', error);
        throw error;
      }
    } else {
      // Video track varsa sadece enable/disable yap
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
      console.log('📹', videoTrack.enabled ? 'AÇIK' : 'KAPALI');
    }
  }, []);

  // Aramayı bitir
  const endCall = useCallback(() => {
    console.log('📴 Arama sonlandırılıyor...');
    
    // Tracks kapat
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('  ⏹️ Track durduruldu:', track.kind);
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Peer connections kapat
    Object.keys(peerConnections.current).forEach(userId => {
      peerConnections.current[userId].close();
    });
    
    peerConnections.current = {};
    setPeers({});
    setAudioEnabled(false);
    setVideoEnabled(false);

    // Backend'e bildir
    if (socket.current && roomId) {
      socket.current.emit('end-call', { roomId });
    }
  }, [roomId]);

  // WebRTC signaling setup
  useEffect(() => {
    if (!roomId) {
      console.error('❌ roomId gerekli!');
      return;
    }

    socket.current = getSocket();
    console.log('📡 Socket bağlandı, room:', roomId);

    // Room users güncellemesi
    const handleRoomUsers = (roomUsers) => {
      console.log('👥 Room users:', roomUsers.length, 'kullanıcı');
      setUsers(roomUsers);
      
      // Local stream varsa yeni kullanıcılara bağlan
      if (localStreamRef.current && socket.current) {
        roomUsers.forEach(user => {
          if (user.id !== socket.current.id && !peerConnections.current[user.id]) {
            console.log('🎯 Bağlanılıyor:', user.name, '(' + user.id + ')');
            
            const pc = createPeerConnection(user.id);
            
            // Offer oluştur
            pc.createOffer()
              .then(offer => pc.setLocalDescription(offer))
              .then(() => {
                console.log('📤 Offer gönderiliyor:', user.id);
                socket.current.emit('webrtc-offer', {
                  to: user.id,
                  offer: pc.localDescription,
                  roomId
                });
              })
              .catch(err => console.error('❌ Offer hatası:', err));
          }
        });
      }
    };

    // Offer geldi
    const handleOffer = async ({ from, offer }) => {
      console.log('📥 Offer geldi:', from);
      
      if (!localStreamRef.current) {
        console.warn('⚠️ Local stream yok, offer ignore ediliyor');
        return;
      }

      try {
        let pc = peerConnections.current[from];
        
        if (!pc) {
          console.log('🆕 Yeni peer oluşturuluyor');
          pc = createPeerConnection(from);
        } else {
          console.log('🔄 Mevcut peer için renegotiation');
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('  ✅ Remote description set');
        
        const answer = await pc.createAnswer();
        console.log('  ✅ Answer oluşturuldu');
        
        await pc.setLocalDescription(answer);
        console.log('  ✅ Local description set');
        
        console.log('📤 Answer gönderiliyor:', from);
        socket.current.emit('webrtc-answer', {
          to: from,
          answer: pc.localDescription
        });
      } catch (error) {
        console.error('❌ Offer handle hatası:', error);
      }
    };

    // Answer geldi
    const handleAnswer = async ({ from, answer }) => {
      console.log('📥 Answer geldi:', from);
      
      const pc = peerConnections.current[from];
      if (!pc) {
        console.warn('⚠️ Peer bulunamadı:', from);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Remote description set:', from);
      } catch (error) {
        console.error('❌ Answer handle hatası:', error);
      }
    };

    // ICE candidate geldi
    const handleIceCandidate = async ({ from, candidate }) => {
      console.log('🧊 ICE candidate geldi:', from);
      
      const pc = peerConnections.current[from];
      if (!pc) {
        console.warn('⚠️ Peer bulunamadı:', from);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('  ✅ ICE candidate eklendi');
      } catch (error) {
        console.error('❌ ICE candidate hatası:', error);
      }
    };

    // User left
    const handleUserLeft = ({ userId }) => {
      console.log('👋 Kullanıcı ayrıldı:', userId);
      removePeerConnection(userId);
    };

    // Call ended
    const handleCallEnded = ({ from }) => {
      console.log('📴 Arama bitti:', from);
      removePeerConnection(from);
    };

    // Event listeners
    socket.current.on('roomUsers', handleRoomUsers);
    socket.current.on('webrtc-offer', handleOffer);
    socket.current.on('webrtc-answer', handleAnswer);
    socket.current.on('ice-candidate', handleIceCandidate);
    socket.current.on('userLeft', handleUserLeft);
    socket.current.on('call-ended', handleCallEnded);

    return () => {
      if (socket.current) {
        socket.current.off('roomUsers', handleRoomUsers);
        socket.current.off('webrtc-offer', handleOffer);
        socket.current.off('webrtc-answer', handleAnswer);
        socket.current.off('ice-candidate', handleIceCandidate);
        socket.current.off('userLeft', handleUserLeft);
        socket.current.off('call-ended', handleCallEnded);
      }
    };
  }, [roomId, createPeerConnection, removePeerConnection]);

  // Local stream hazır olunca mevcut kullanıcılara bağlan
  useEffect(() => {
    if (!localStream || !socket.current || users.length === 0) return;

    console.log('🎥 Local stream hazır, bağlanılıyor...');
    
    users.forEach(user => {
      if (user.id !== socket.current.id && !peerConnections.current[user.id]) {
        console.log('🔌 Auto-connect:', user.name);
        
        const pc = createPeerConnection(user.id);
        
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.current.emit('webrtc-offer', {
              to: user.id,
              offer: pc.localDescription,
              roomId
            });
          })
          .catch(err => console.error('❌ Auto-connect hatası:', err));
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

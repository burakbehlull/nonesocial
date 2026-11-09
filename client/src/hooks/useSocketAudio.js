import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@services/socket';

export const useSocketAudio = (roomId) => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [users, setUsers] = useState([]);
  const [inCall, setInCall] = useState(false);
  
  const socket = useRef(null);
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const remoteAudioContextsRef = useRef({}); // Her kullanıcı için ayrı context
  const audioQueuesRef = useRef({}); // Her kullanıcı için audio queue
  const isPlayingRef = useRef({}); // Playback durumu

  // Mikrofon aç ve ses yakalama başlat
  const initializeAudio = useCallback(async () => {
    try {
      console.log('🎤 Mikrofon izni isteniyor...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Yüksek kalite
          channelCount: 1
        },
        video: false
      });
      
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = true;
      
      localStreamRef.current = stream;
      setAudioEnabled(true);
      
      console.log('✅ Mikrofon erişimi verildi');
      
      // MediaRecorder için codec desteğini kontrol et
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn('⚠️ Opus desteklenmiyor, webm deneniyor...');
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          console.warn('⚠️ webm desteklenmiyor, varsayılan kullanılacak');
          mimeType = '';
        }
      }
      
      console.log('🎵 Kullanılan codec:', mimeType || 'default');
      
      // MediaRecorder kullanarak ses kaydet (daha verimli)
      const mediaRecorder = new MediaRecorder(stream, mimeType ? {
        mimeType,
        audioBitsPerSecond: 48000 // Kaliteli ses
      } : undefined);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && audioTrack.enabled && socket.current) {
          console.log(`📤 Ses paketi gönderiliyor: ${event.data.size} bytes`);
          
          // Blob'u ArrayBuffer'a çevir
          event.data.arrayBuffer().then((buffer) => {
            // Base64'e encode et (socket için)
            const base64 = btoa(
              new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            
            console.log(`📤 Base64 boyut: ${base64.length} chars`);
            
            socket.current.emit('audio-data', {
              roomId,
              audioData: base64
            });
          });
        }
      };
      
      // 100ms chunk'lar halinde gönder (düşük latency)
      mediaRecorder.start(100);
      
      console.log('🎵 Ses yakalama başladı (100ms chunks)');
      
      return stream;
    } catch (error) {
      console.error('❌ Mikrofon hatası:', error);
      throw error;
    }
  }, [roomId]);

  // Remote ses çal (queue sistemiyle)
  const playRemoteAudio = useCallback(async (userId, audioDataBase64) => {
    try {
      console.log(`🔊 playRemoteAudio çağrıldı: ${userId.slice(0, 8)}`);
      
      // Audio context yoksa oluştur
      if (!remoteAudioContextsRef.current[userId]) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          latencyHint: 'interactive', // Düşük latency
          sampleRate: 48000
        });
        remoteAudioContextsRef.current[userId] = audioContext;
        audioQueuesRef.current[userId] = [];
        isPlayingRef.current[userId] = false;
        console.log('🔊 Audio context oluşturuldu:', userId.slice(0, 8));
      }
      
      const audioContext = remoteAudioContextsRef.current[userId];
      
      // Base64'ü decode et
      const binaryString = atob(audioDataBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log(`🎵 Decoded bytes: ${bytes.length}`);
      
      // ArrayBuffer'ı AudioBuffer'a decode et
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
      console.log(`✅ Audio buffer decode edildi: ${audioBuffer.duration.toFixed(3)}s, ${audioBuffer.numberOfChannels} kanal`);
      
      // Queue'ya ekle
      audioQueuesRef.current[userId].push(audioBuffer);
      console.log(`📦 Queue'ya eklendi, toplam: ${audioQueuesRef.current[userId].length}`);
      
      // Eğer çalmıyorsa başlat
      if (!isPlayingRef.current[userId]) {
        playNextInQueue(userId);
      }
      
    } catch (error) {
      console.error('❌ Ses çalma hatası:', userId.slice(0, 8), error);
    }
  }, []);

  // Queue'dan sıradaki ses parçasını çal
  const playNextInQueue = (userId) => {
    const queue = audioQueuesRef.current[userId];
    const audioContext = remoteAudioContextsRef.current[userId];
    
    if (!queue || queue.length === 0) {
      console.log(`🔇 Queue boş: ${userId.slice(0, 8)}`);
      isPlayingRef.current[userId] = false;
      return;
    }
    
    console.log(`▶️ Çalınıyor: ${userId.slice(0, 8)}, kalan: ${queue.length}`);
    
    isPlayingRef.current[userId] = true;
    const audioBuffer = queue.shift();
    
    // Buffer source oluştur ve çal
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Gain node (volume control için)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Bittiğinde sıradakini çal
    source.onended = () => {
      console.log(`✅ Chunk bitti: ${userId.slice(0, 8)}`);
      playNextInQueue(userId);
    };
    
    source.start(0);
  };

  // Mikrofon toggle
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn('⚠️ Local stream yok!');
      return;
    }
    
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
      console.log('🎤', audioTrack.enabled ? 'AÇIK' : 'KAPALI');
    }
  }, []);

  // Çağrıya katıl
  const joinCall = useCallback(async () => {
    if (!socket.current || !roomId) return;
    
    try {
      await initializeAudio();
      
      // Backend'e bildir
      socket.current.emit('join-call', { roomId });
      setInCall(true);
      
      console.log('📞 Çağrıya katıldı');
    } catch (error) {
      console.error('❌ Çağrıya katılma hatası:', error);
      throw error;
    }
  }, [roomId, initializeAudio]);

  // Çağrıdan ayrıl
  const leaveCall = useCallback(() => {
    console.log('📴 Çağrıdan ayrılıyor...');
    
    // MediaRecorder durdur
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    // Stream durdur
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('  ⏹️ Track durduruldu');
      });
      localStreamRef.current = null;
    }
    
    // Remote audio context'leri temizle
    Object.entries(remoteAudioContextsRef.current).forEach(([userId, ctx]) => {
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    });
    remoteAudioContextsRef.current = {};
    audioQueuesRef.current = {};
    isPlayingRef.current = {};
    
    setAudioEnabled(false);
    setInCall(false);
    
    // Backend'e bildir
    if (socket.current && roomId) {
      socket.current.emit('leave-call', { roomId });
    }
    
    console.log('✅ Çağrıdan ayrıldı');
  }, [roomId]);

  // Socket event handlers
  useEffect(() => {
    if (!roomId) {
      console.error('❌ roomId gerekli!');
      return;
    }

    socket.current = getSocket();
    console.log('📡 Socket bağlandı, room:', roomId);

    // Room users
    const handleRoomUsers = (roomUsers) => {
      console.log('👥 Room users:', roomUsers.length, 'kullanıcı');
      console.log('  🔊 Çağrıda:', roomUsers.filter(u => u.inCall).length, 'kullanıcı');
      setUsers(roomUsers);
    };

    // Audio data geldi (başka kullanıcıdan)
    const handleAudioData = ({ userId, audioData }) => {
      console.log(`📥 Ses paketi alındı: ${userId.slice(0, 8)}, boyut: ${audioData.length} chars`);
      // Sesi çal
      playRemoteAudio(userId, audioData);
    };

    // User left
    const handleUserLeft = ({ userId }) => {
      console.log('👋 Kullanıcı ayrıldı:', userId.slice(0, 8));
      
      // Audio context temizle
      if (remoteAudioContextsRef.current[userId]) {
        remoteAudioContextsRef.current[userId].close();
        delete remoteAudioContextsRef.current[userId];
        delete audioQueuesRef.current[userId];
        delete isPlayingRef.current[userId];
      }
    };

    // User left call
    const handleUserLeftCall = ({ userId }) => {
      console.log('📴 Kullanıcı çağrıdan ayrıldı:', userId.slice(0, 8));
      
      // Audio context temizle
      if (remoteAudioContextsRef.current[userId]) {
        remoteAudioContextsRef.current[userId].close();
        delete remoteAudioContextsRef.current[userId];
        delete audioQueuesRef.current[userId];
        delete isPlayingRef.current[userId];
      }
    };

    // Event listeners
    socket.current.on('roomUsers', handleRoomUsers);
    socket.current.on('audio-data', handleAudioData);
    socket.current.on('userLeft', handleUserLeft);
    socket.current.on('user-left-call', handleUserLeftCall);

    return () => {
      if (socket.current) {
        socket.current.off('roomUsers', handleRoomUsers);
        socket.current.off('audio-data', handleAudioData);
        socket.current.off('userLeft', handleUserLeft);
        socket.current.off('user-left-call', handleUserLeftCall);
      }
      
      // Cleanup
      leaveCall();
    };
  }, [roomId, playRemoteAudio, leaveCall]);

  return {
    audioEnabled,
    users,
    inCall,
    toggleAudio,
    joinCall,
    leaveCall
  };
};

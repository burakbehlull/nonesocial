import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@services/socket';

export const useSocketAudio = (roomId) => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [users, setUsers] = useState([]);
  const [inCall, setInCall] = useState(false);
  
  const socket = useRef(null);
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorNodeRef = useRef(null);
  const remoteAudiosRef = useRef({}); // Her kullanıcı için ayrı audio element
  const audioBuffersRef = useRef({}); // Her kullanıcı için buffer

  // Mikrofon aç ve ses yakalama başlat
  const initializeAudio = useCallback(async () => {
    try {
      console.log('🎤 Mikrofon izni isteniyor...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = true; // Başlangıçta açık
      
      localStreamRef.current = stream;
      setAudioEnabled(true);
      
      console.log('✅ Mikrofon erişimi verildi');
      
      // Audio context oluştur
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Mikrofon source
      const source = audioContext.createMediaStreamSource(stream);
      
      // Script processor (ses verilerini yakalamak için)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        
        // Mikrofon kapalıysa veya çağrıda değilsek veri gönderme
        if (!audioTrack || !audioTrack.enabled || !socket.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Float32Array'i daha küçük formata çevir (16-bit PCM)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Socket ile gönder
        socket.current.emit('audio-data', {
          roomId,
          audioData: Array.from(pcmData) // ArrayBuffer yerine normal array
        });
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      processorNodeRef.current = processor;
      
      console.log('🎵 Ses yakalama başladı');
      
      return stream;
    } catch (error) {
      console.error('❌ Mikrofon hatası:', error);
      throw error;
    }
  }, [roomId]);

  // Remote ses çal
  const playRemoteAudio = useCallback((userId, audioData) => {
    try {
      // Audio element yoksa oluştur
      if (!remoteAudiosRef.current[userId]) {
        const audio = new Audio();
        audio.autoplay = true;
        remoteAudiosRef.current[userId] = audio;
        audioBuffersRef.current[userId] = [];
        console.log('🔊 Audio element oluşturuldu:', userId);
      }
      
      const audioContext = audioContextRef.current;
      if (!audioContext) {
        console.warn('⚠️ AudioContext yok');
        return;
      }
      
      // Int16Array'e çevir
      const pcmData = new Int16Array(audioData);
      
      // Float32Array'e çevir (playback için)
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7FFF);
      }
      
      // AudioBuffer oluştur
      const audioBuffer = audioContext.createBuffer(1, floatData.length, audioContext.sampleRate);
      audioBuffer.getChannelData(0).set(floatData);
      
      // BufferSource oluştur ve çal
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // 🔊 Gain Node ile ses seviyesi kontrolü
      const gainNode = audioContext.createGain();
      
      // LocalStorage'dan kullanıcının ses seviyesini al (varsayılan 100%)
      const volumePercent = parseInt(localStorage.getItem(`volume_${userId}`) || '100');
      gainNode.gain.value = volumePercent / 100; // 0-2 arası (0% - 200%)
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start(0);
      
    } catch (error) {
      console.error('❌ Ses çalma hatası:', error);
    }
  }, []);

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
    
    // Processor durdur
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    
    // Audio context kapat
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stream durdur
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('  ⏹️ Track durduruldu');
      });
      localStreamRef.current = null;
    }
    
    // Remote audio'ları temizle
    Object.values(remoteAudiosRef.current).forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    remoteAudiosRef.current = {};
    audioBuffersRef.current = {};
    
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
      // Sesi çal (çağrıda olup olmama önemli değil, backend kontrol ediyor)
      playRemoteAudio(userId, audioData);
    };

    // User left
    const handleUserLeft = ({ userId }) => {
      console.log('👋 Kullanıcı ayrıldı:', userId);
      
      // Audio element'i temizle
      if (remoteAudiosRef.current[userId]) {
        remoteAudiosRef.current[userId].pause();
        remoteAudiosRef.current[userId].src = '';
        delete remoteAudiosRef.current[userId];
        delete audioBuffersRef.current[userId];
      }
    };

    // User left call
    const handleUserLeftCall = ({ userId }) => {
      console.log('📴 Kullanıcı çağrıdan ayrıldı:', userId);
      
      // Audio element'i temizle
      if (remoteAudiosRef.current[userId]) {
        remoteAudiosRef.current[userId].pause();
        remoteAudiosRef.current[userId].src = '';
        delete remoteAudiosRef.current[userId];
        delete audioBuffersRef.current[userId];
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

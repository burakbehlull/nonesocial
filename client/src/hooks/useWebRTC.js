import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from '@services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ]
};

export const useWebRTC = (roomId) => {
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [users, setUsers] = useState([]);
  
  const peersRef = useRef({});
  const socket = useRef(null);
  const localStreamRef = useRef(null);

  // Initialize media stream
  const initializeMedia = useCallback(async (includeVideo = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: includeVideo,
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioEnabled(true);
      setVideoEnabled(includeVideo);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  // Create peer connection
  const createPeer = useCallback((userId, initiator, stream) => {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: ICE_SERVERS,
      stream
    });

    peer.on('signal', (signal) => {
      if (socket.current) {
        if (initiator) {
          socket.current.emit('call-user', {
            roomId,
            to: userId,
            signal
          });
        } else {
          socket.current.emit('answer-call', {
            to: userId,
            signal
          });
        }
      }
    });

    peer.on('stream', (remoteStream) => {
      setPeers((prev) => ({
        ...prev,
        [userId]: { peer, stream: remoteStream }
      }));
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    peer.on('close', () => {
      console.log('Peer closed:', userId);
      removePeer(userId);
    });

    peersRef.current[userId] = peer;
    return peer;
  }, [roomId]);

  // Remove peer
  const removePeer = useCallback((userId) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].destroy();
      delete peersRef.current[userId];
    }
    
    setPeers((prev) => {
      const newPeers = { ...prev };
      delete newPeers[userId];
      return newPeers;
    });
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        
        if (socket.current) {
          socket.current.emit('toggle-audio', {
            roomId,
            enabled: audioTrack.enabled
          });
        }
      }
    }
  }, [roomId]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (videoTrack) {
        // Video track var, aç/kapat
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        
        if (socket.current) {
          socket.current.emit('toggle-video', {
            roomId,
            enabled: videoTrack.enabled
          });
        }
      } else {
        // Video track yok, kamera izni iste
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          const newVideoTrack = videoStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(newVideoTrack);
          
          // Yeni stream'i set et
          setLocalStream(new MediaStream([
            ...localStreamRef.current.getAudioTracks(),
            newVideoTrack
          ]));
          
          setVideoEnabled(true);
          
          // Update all peer connections with new video track
          Object.values(peersRef.current).forEach(peer => {
            peer.addTrack(newVideoTrack, localStreamRef.current);
          });
          
          if (socket.current) {
            socket.current.emit('toggle-video', {
              roomId,
              enabled: true
            });
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          throw error;
        }
      }
    }
  }, [roomId]);

  // End call
  const endCall = useCallback(() => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Destroy all peer connections
    Object.keys(peersRef.current).forEach(userId => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
      }
    });
    
    peersRef.current = {};
    setPeers({});

    // Notify server
    if (socket.current) {
      socket.current.emit('end-call', { roomId });
    }
  }, [roomId]);

  // Initialize WebRTC
  useEffect(() => {
    socket.current = getSocket();

    const handleIncomingCall = async ({ from, signal }) => {
      if (localStreamRef.current) {
        const peer = createPeer(from, false, localStreamRef.current);
        peer.signal(signal);
      }
    };

    const handleCallAnswered = ({ from, signal }) => {
      const peer = peersRef.current[from];
      if (peer) {
        peer.signal(signal);
      }
    };

    const handleUserLeft = ({ userId }) => {
      removePeer(userId);
    };

    const handleCallEnded = ({ from }) => {
      removePeer(from);
    };

    const handleRoomUsers = (roomUsers) => {
      setUsers(roomUsers);
      
      // Connect to existing users
      if (localStreamRef.current) {
        roomUsers.forEach(user => {
          if (user.id !== socket.current.id && !peersRef.current[user.id]) {
            createPeer(user.id, true, localStreamRef.current);
          }
        });
      }
    };

    socket.current.on('incoming-call', handleIncomingCall);
    socket.current.on('call-answered', handleCallAnswered);
    socket.current.on('userLeft', handleUserLeft);
    socket.current.on('call-ended', handleCallEnded);
    socket.current.on('roomUsers', handleRoomUsers);

    return () => {
      socket.current?.off('incoming-call', handleIncomingCall);
      socket.current?.off('call-answered', handleCallAnswered);
      socket.current?.off('userLeft', handleUserLeft);
      socket.current?.off('call-ended', handleCallEnded);
      socket.current?.off('roomUsers', handleRoomUsers);
    };
  }, [roomId, createPeer, removePeer]);

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

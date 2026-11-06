import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from '@services/socket';

const ICE_SERVERS = {
  iceServers: [
    // STUN servers for NAT discovery
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Public TURN servers for NAT traversal (critical for production!)
    { 
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
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
    try {
      console.log(`Creating peer ${initiator ? 'initiator' : 'receiver'} for user:`, userId);
      
      // Validate inputs
      if (!userId) {
        console.error('Cannot create peer without userId');
        return null;
      }

      if (!stream) {
        console.error('Cannot create peer without stream');
        return null;
      }

      if (!socket.current) {
        console.error('Cannot create peer without socket connection');
        return null;
      }

      if (!roomId) {
        console.error('Cannot create peer without roomId');
        return null;
      }

      // Check if SimplePeer is available
      if (typeof SimplePeer !== 'function') {
        console.error('SimplePeer is not a constructor');
        return null;
      }
      
      const peer = new SimplePeer({
        initiator: initiator,
        trickle: true,
        config: ICE_SERVERS,
        stream: stream
      });

      peer.on('signal', (signal) => {
        console.log('Sending signal to:', userId, 'initiator:', initiator);
        if (socket.current) {
          if (initiator) {
            socket.current.emit('call-user', {
              roomId: roomId,
              to: userId,
              signal: signal
            });
          } else {
            socket.current.emit('answer-call', {
              to: userId,
              signal: signal
            });
          }
        }
      });

      // ICE candidate handling - CRITICAL for NAT traversal
      peer.on('iceStateChange', (iceConnectionState, iceGatheringState) => {
        console.log('ICE State:', iceConnectionState, 'Gathering:', iceGatheringState);
      });

      peer.on('data', (data) => {
        console.log('Received data from peer:', userId, data.toString());
      });

      peer.on('stream', (remoteStream) => {
        console.log('Received stream from:', userId);
        setPeers((prev) => ({
          ...prev,
          [userId]: { peer, stream: remoteStream }
        }));
      });

      peer.on('error', (err) => {
        console.error('Peer error with', userId, ':', err);
      });

      peer.on('close', () => {
        console.log('Peer connection closed:', userId);
        removePeer(userId);
      });

      peer.on('connect', () => {
        console.log('Peer connected:', userId);
      });

      peersRef.current[userId] = peer;
      return peer;
    } catch (error) {
      console.error('Error creating peer:', error);
      return null;
    }
  }, [roomId]);

  // Remove peer
  const removePeer = useCallback((userId) => {
    if (peersRef.current[userId]) {
      try {
        peersRef.current[userId].destroy();
      } catch (error) {
        console.error('Error destroying peer:', error);
      }
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
        
        if (socket.current && roomId) {
          socket.current.emit('toggle-audio', {
            roomId: roomId,
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
        
        if (socket.current && roomId) {
          socket.current.emit('toggle-video', {
            roomId: roomId,
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
            if (peer && peer.addTrack) {
              peer.addTrack(newVideoTrack, localStreamRef.current);
            }
          });
          
          if (socket.current && roomId) {
            socket.current.emit('toggle-video', {
              roomId: roomId,
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
        try {
          peersRef.current[userId].destroy();
        } catch (error) {
          console.error('Error destroying peer:', error);
        }
      }
    });
    
    peersRef.current = {};
    setPeers({});

    // Notify server
    if (socket.current && roomId) {
      socket.current.emit('end-call', { roomId: roomId });
    }
  }, [roomId]);

  // Initialize WebRTC
  useEffect(() => {
    if (!roomId) {
      console.error('useWebRTC: roomId is required');
      return;
    }

    socket.current = getSocket();

    if (!socket.current) {
      console.error('useWebRTC: Failed to get socket');
      return;
    }

    const handleIncomingCall = async ({ from, signal }) => {
      console.log('📞 Incoming call from:', from);
      if (localStreamRef.current && from) {
        const peer = createPeer(from, false, localStreamRef.current);
        if (peer && signal) {
          try {
            peer.signal(signal);
          } catch (error) {
            console.error('Error signaling peer:', error);
          }
        }
      } else {
        console.warn('⚠️ No local stream available for incoming call');
      }
    };

    const handleCallAnswered = ({ from, signal }) => {
      console.log('✅ Call answered by:', from);
      if (!from || !signal) {
        console.warn('Invalid call answered data');
        return;
      }

      const peer = peersRef.current[from];
      if (peer) {
        try {
          peer.signal(signal);
        } catch (error) {
          console.error('Error signaling peer on answer:', error);
        }
      } else {
        console.warn('No peer found for answered call from:', from);
      }
    };

    const handleIceCandidate = ({ from, candidate }) => {
      console.log('🧊 ICE candidate from:', from);
      const peer = peersRef.current[from];
      if (peer && candidate) {
        try {
          peer.signal({ candidate });
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    const handleUserLeft = ({ userId }) => {
      console.log('User left:', userId);
      if (userId) {
        removePeer(userId);
      }
    };

    const handleCallEnded = ({ from }) => {
      console.log('Call ended from:', from);
      if (from) {
        removePeer(from);
      }
    };

    const handleRoomUsers = (roomUsers) => {
      console.log('👥 Room users updated:', roomUsers);
      if (!Array.isArray(roomUsers)) {
        console.warn('Invalid room users data');
        return;
      }

      setUsers(roomUsers);
      
      // Connect to existing users if we have a local stream
      if (localStreamRef.current && socket.current) {
        console.log(`🔗 Attempting to connect to ${roomUsers.length} users`);
        roomUsers.forEach(user => {
          // Don't connect to yourself
          if (user && user.id && user.id !== socket.current.id && !peersRef.current[user.id]) {
            console.log('🎯 Creating peer connection to:', user.id, user.name);
            createPeer(user.id, true, localStreamRef.current);
          }
        });
      } else {
        console.log('⏳ Waiting for local stream before connecting to peers');
      }
    };

    socket.current.on('incoming-call', handleIncomingCall);
    socket.current.on('call-answered', handleCallAnswered);
    socket.current.on('ice-candidate', handleIceCandidate);
    socket.current.on('userLeft', handleUserLeft);
    socket.current.on('call-ended', handleCallEnded);
    socket.current.on('roomUsers', handleRoomUsers);

    return () => {
      if (socket.current) {
        socket.current.off('incoming-call', handleIncomingCall);
        socket.current.off('call-answered', handleCallAnswered);
        socket.current.off('ice-candidate', handleIceCandidate);
        socket.current.off('userLeft', handleUserLeft);
        socket.current.off('call-ended', handleCallEnded);
        socket.current.off('roomUsers', handleRoomUsers);
      }
    };
  }, [roomId, createPeer, removePeer]);

  // When localStream is available, connect to existing users
  useEffect(() => {
    if (!localStream || !Array.isArray(users) || users.length === 0 || !socket.current) {
      return;
    }

    console.log('🎥 Local stream available, connecting to users:', users);
    users.forEach(user => {
      if (user && user.id && user.id !== socket.current?.id && !peersRef.current[user.id]) {
        console.log('🔌 Creating delayed peer connection to:', user.id, user.name);
        createPeer(user.id, true, localStream);
      }
    });
  }, [localStream, users, createPeer]);

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

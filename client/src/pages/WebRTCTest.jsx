import { useState, useEffect, useRef } from 'react';
import { getSocket } from '@services/socket';

const WebRTCTest = () => {
  const [roomId, setRoomId] = useState('test-room');
  const [status, setStatus] = useState('disconnected');
  const [logs, setLogs] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time: timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

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

  // Test 1: Socket Connection
  const testSocketConnection = () => {
    addLog('Testing socket connection...', 'info');
    socketRef.current = getSocket();
    
    socketRef.current.on('connect', () => {
      setStatus('connected');
      addLog('✅ Socket connected: ' + socketRef.current.id, 'success');
    });

    socketRef.current.on('disconnect', () => {
      setStatus('disconnected');
      addLog('❌ Socket disconnected', 'error');
    });

    socketRef.current.on('connect_error', (error) => {
      addLog('❌ Connection error: ' + error.message, 'error');
    });
  };

  // Test 2: Media Access
  const testMediaAccess = async () => {
    try {
      addLog('Testing media access...', 'info');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      addLog(`✅ Media access granted (${stream.getTracks().length} tracks)`, 'success');
      stream.getTracks().forEach(track => {
        addLog(`  - ${track.kind}: ${track.label}`, 'info');
      });
    } catch (error) {
      addLog('❌ Media access failed: ' + error.message, 'error');
    }
  };

  // Test 3: Join Room
  const testJoinRoom = () => {
    if (!socketRef.current) {
      addLog('❌ Socket not connected', 'error');
      return;
    }

    addLog(`Joining room: ${roomId}`, 'info');
    
    socketRef.current.emit('createRoom', {
      name: 'Test Room',
      password: null,
      limit: 10,
      videoEnabled: true
    }, (response) => {
      if (response.success) {
        addLog(`✅ Room created: ${response.roomId}`, 'success');
        setRoomId(response.roomId);
        setupWebRTCListeners();
      } else {
        addLog('❌ Failed to create room', 'error');
      }
    });
  };

  // Setup WebRTC event listeners
  const setupWebRTCListeners = () => {
    addLog('Setting up WebRTC listeners...', 'info');

    socketRef.current.on('roomUsers', (users) => {
      addLog(`👥 Room users updated: ${users.length} users`, 'info');
      users.forEach(user => {
        addLog(`  - ${user.name} (${user.id})`, 'info');
        
        // Create peer connection for each user (except self)
        if (user.id !== socketRef.current.id && !peerConnectionsRef.current[user.id]) {
          createPeerConnection(user.id, true);
        }
      });
    });

    socketRef.current.on('incoming-call', async ({ from, signal }) => {
      addLog(`📞 Incoming call from: ${from}`, 'info');
      await handleIncomingCall(from, signal);
    });

    socketRef.current.on('call-answered', async ({ from, signal }) => {
      addLog(`✅ Call answered by: ${from}`, 'success');
      await handleCallAnswered(from, signal);
    });

    socketRef.current.on('ice-candidate', async ({ from, candidate }) => {
      addLog(`🧊 ICE candidate from: ${from}`, 'info');
      await handleIceCandidate(from, candidate);
    });
  };

  // Create peer connection
  const createPeerConnection = (userId, isInitiator) => {
    addLog(`🔗 Creating peer connection to: ${userId} (initiator: ${isInitiator})`, 'info');

    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
          addLog(`  ➕ Added ${track.kind} track`, 'info');
        });
      }

      // Handle remote tracks
      pc.ontrack = (event) => {
        addLog(`📺 Received ${event.track.kind} from: ${userId}`, 'success');
        setRemoteStreams(prev => ({
          ...prev,
          [userId]: event.streams[0]
        }));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addLog(`🧊 Sending ICE candidate to: ${userId}`, 'info');
          socketRef.current?.emit('ice-candidate', {
            to: userId,
            candidate: event.candidate,
            roomId
          });
        }
      };

      // Connection state
      pc.onconnectionstatechange = () => {
        addLog(`🔌 Connection state with ${userId}: ${pc.connectionState}`, 
          pc.connectionState === 'connected' ? 'success' : 'info');
      };

      pc.oniceconnectionstatechange = () => {
        addLog(`🧊 ICE state with ${userId}: ${pc.iceConnectionState}`,
          pc.iceConnectionState === 'connected' ? 'success' : 'info');
      };

      peerConnectionsRef.current[userId] = pc;

      // Create offer if initiator
      if (isInitiator) {
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            addLog(`📤 Sending offer to: ${userId}`, 'info');
            socketRef.current?.emit('call-user', {
              roomId,
              to: userId,
              signal: pc.localDescription
            });
          })
          .catch(err => addLog('❌ Error creating offer: ' + err.message, 'error'));
      }

      return pc;
    } catch (error) {
      addLog('❌ Error creating peer connection: ' + error.message, 'error');
      return null;
    }
  };

  // Handle incoming call
  const handleIncomingCall = async (from, signal) => {
    if (!localStream) {
      addLog('⚠️ No local stream available', 'error');
      return;
    }

    try {
      const pc = createPeerConnection(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      addLog(`📨 Sending answer to: ${from}`, 'info');
      socketRef.current?.emit('answer-call', {
        to: from,
        signal: pc.localDescription
      });
    } catch (error) {
      addLog('❌ Error handling incoming call: ' + error.message, 'error');
    }
  };

  // Handle call answered
  const handleCallAnswered = async (from, signal) => {
    const pc = peerConnectionsRef.current[from];
    if (!pc) {
      addLog('⚠️ No peer connection for: ' + from, 'error');
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      addLog(`✅ Remote description set for: ${from}`, 'success');
    } catch (error) {
      addLog('❌ Error setting remote description: ' + error.message, 'error');
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (from, candidate) => {
    const pc = peerConnectionsRef.current[from];
    if (!pc) {
      addLog('⚠️ No peer connection for ICE candidate from: ' + from, 'error');
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      addLog(`✅ ICE candidate added from: ${from}`, 'success');
    } catch (error) {
      addLog('❌ Error adding ICE candidate: ' + error.message, 'error');
    }
  };

  // Clear logs
  const clearLogs = () => setLogs([]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 WebRTC Test Suite</h1>

        {/* Status */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              status === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="font-medium">
              Status: {status === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testSocketConnection}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition"
          >
            1. Test Socket
          </button>
          <button
            onClick={testMediaAccess}
            className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-medium transition"
          >
            2. Test Media
          </button>
          <button
            onClick={testJoinRoom}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-medium transition"
            disabled={!localStream}
          >
            3. Join Room
          </button>
          <button
            onClick={clearLogs}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg font-medium transition"
          >
            Clear Logs
          </button>
        </div>

        {/* Videos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Local Video */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">📹 Local Video (You)</h3>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full bg-black rounded aspect-video"
            />
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([userId, stream]) => (
            <div key={userId} className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">📺 Remote: {userId.slice(0, 8)}</h3>
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
                className="w-full bg-black rounded aspect-video"
              />
            </div>
          ))}
        </div>

        {/* Logs */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">📋 Logs</h3>
            <span className="text-sm text-gray-400">{logs.length} entries</span>
          </div>
          <div className="bg-black rounded p-3 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No logs yet. Start testing!
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`mb-1 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  'text-gray-300'
                }`}>
                  <span className="text-gray-500">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCTest;

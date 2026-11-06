import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from '@services/socket';
import { useWebRTC } from '@hooks/useWebRTC';
import RoomLayout from '@components/RoomLayout';
import { Button } from '@components/ui/button';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiPhone } from 'react-icons/fi';

export default function RoomSimple() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const password = location.state?.password || '';

  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isInCall, setIsInCall] = useState(false);

  const {
    peers,
    localStream,
    audioEnabled,
    videoEnabled,
    initializeMedia,
    toggleAudio,
    toggleVideo,
    endCall
  } = useWebRTC(roomId);

  // Socket setup
  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);
    setCurrentUserId(socketInstance.id);

    // Join room
    socketInstance.emit('getRoomInfo', { roomId }, (response) => {
      if (!response.success) {
        toast.error('Oda bulunamadı');
        navigate('/');
        return;
      }

      socketInstance.emit('joinRoom', { roomId, password }, (joinResponse) => {
        if (!joinResponse.success) {
          toast.error(joinResponse.message || 'Odaya katılamadı');
          navigate('/');
          return;
        }

        toast.success('Odaya katıldınız!');
      });
    });

    // Room users
    socketInstance.on('roomUsers', (roomUsers) => {
      console.log('👥 Users updated:', roomUsers);
      setUsers(roomUsers);
    });

    // Messages
    socketInstance.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Kicked/Banned
    socketInstance.on('kicked', () => {
      toast.error('Odadan atıldınız');
      navigate('/');
    });

    socketInstance.on('roomClosed', () => {
      toast.error('Oda kapatıldı');
      navigate('/');
    });

    return () => {
      socketInstance.off('roomUsers');
      socketInstance.off('receiveMessage');
      socketInstance.off('kicked');
      socketInstance.off('roomClosed');
      socketInstance.emit('leaveRoom', { roomId });
    };
  }, [roomId, navigate, password]);

  // Join call
  const handleJoinCall = async () => {
    try {
      toast.loading('Mikrofon/kamera açılıyor...', { id: 'media' });
      await initializeMedia(false); // false = kamera kapalı başlasın
      setIsInCall(true);
      toast.success('Sese katıldınız!', { id: 'media' });
    } catch (error) {
      console.error('Media error:', error);
      toast.error('Mikrofon/kamera erişimi reddedildi', { id: 'media' });
    }
  };

  // Leave call
  const handleLeaveCall = () => {
    endCall();
    setIsInCall(false);
    toast.success('Sesten ayrıldınız');
  };

  // Send message
  const handleSendMessage = (message) => {
    if (socket) {
      socket.emit('sendMessage', { roomId, message }, (response) => {
        if (!response?.success) {
          toast.error('Mesaj gönderilemedi');
        }
      });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b bg-muted/30 flex items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-bold">NoneSocial</h1>
          <p className="text-xs text-muted-foreground">Oda: {roomId}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {!isInCall ? (
            <Button
              onClick={handleJoinCall}
              className="bg-green-600 hover:bg-green-700"
              aria-label="Sese katıl"
            >
              <FiPhone className="w-4 h-4 mr-2" />
              Sese Katıl
            </Button>
          ) : (
            <>
              <Button
                variant={audioEnabled ? 'default' : 'destructive'}
                size="sm"
                onClick={toggleAudio}
                aria-label={audioEnabled ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
                aria-pressed={audioEnabled}
              >
                {audioEnabled ? <FiMic className="w-4 h-4" /> : <FiMicOff className="w-4 h-4" />}
              </Button>

              <Button
                variant={videoEnabled ? 'default' : 'destructive'}
                size="sm"
                onClick={toggleVideo}
                aria-label={videoEnabled ? 'Kamerayı kapat' : 'Kamerayı aç'}
                aria-pressed={videoEnabled}
              >
                {videoEnabled ? <FiVideo className="w-4 h-4" /> : <FiVideoOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLeaveCall}
                aria-label="Aramayı bitir"
              >
                <FiPhoneOff className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <RoomLayout
          localStream={localStream}
          peers={peers}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          users={users}
          currentUserId={currentUserId}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

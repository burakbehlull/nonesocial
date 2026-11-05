import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from '@services/socket';
import { useWebRTC } from '@hooks/useWebRTC';
import { useRoomStore } from '@store/roomStore';
import { useTheme } from '@contexts/ThemeContext';
import VideoGrid from '@components/VideoGrid';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Separator } from '@components/ui/separator';
import { 
  FiCopy, FiSettings, FiUsers, FiSend, 
  FiMic, FiMicOff, FiVideo, FiVideoOff, 
  FiPhoneOff, FiMoon, FiSun, FiUserX,
  FiPhoneIncoming, FiPhoneOutgoing
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { copyToClipboard, generateRoomLink, formatTime } from '@utils/helpers';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const password = location.state?.password || '';
  const { isDark, toggleTheme } = useTheme();

  const [socket, setSocket] = useState(null);
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isInCall, setIsInCall] = useState(false);

  const {
    roomInfo,
    messages,
    users,
    isOwner,
    currentUserId,
    setRoomInfo,
    setIsOwner,
    setCurrentUserId,
    setUsers,
    addMessage,
    clearRoom
  } = useRoomStore();

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

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    socketInstance.emit('joinRoom', { roomId, password }, (response) => {
      if (!response.success) {
        toast.error(response.message || 'Odaya katılamadı');
        navigate('/');
        return;
      }

      setRoomInfo(response.room);
      toast.success('Odaya katıldınız! Çağrıya katılmak için butona tıklayın.');
    });

    socketInstance.emit('getRoomInfo', { roomId }, (response) => {
      if (response.success) {
        setIsOwner(response.isOwner);
        setCurrentUserId(socketInstance.id);
        setUsers(response.users);
      }
    });

    socketInstance.on('roomUsers', (roomUsers) => setUsers(roomUsers));
    socketInstance.on('receiveMessage', (message) => addMessage(message));
    socketInstance.on('kicked', () => {
      toast.error('Odadan atıldınız');
      handleLeaveRoom();
    });
    socketInstance.on('roomClosed', () => {
      toast.error('Oda kapatıldı');
      handleLeaveRoom();
    });

    return () => {
      socketInstance.off('roomUsers');
      socketInstance.off('receiveMessage');
      socketInstance.off('kicked');
      socketInstance.off('roomClosed');
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !socket) return;
    
    socket.emit('sendMessage', { roomId, message: messageInput }, (response) => {
      if (response?.success) {
        setMessageInput('');
      } else {
        toast.error('Mesaj gönderilemedi');
      }
    });
  };

  const handleChangeName = () => {
    if (!userName.trim()) {
      toast.error('Lütfen bir isim girin');
      return;
    }

    socket.emit('changeName', { roomId, newName: userName }, (response) => {
      if (response?.success) {
        toast.success('İsim güncellendi!');
        setShowNameModal(false);
        setUserName('');
      } else {
        toast.error(response?.message || 'İsim güncellenemedi');
      }
    });
  };

  const handleKickUser = (targetSocketId) => {
    socket?.emit('kickUser', { roomId, targetSocketId }, (response) => {
      if (response?.success) {
        toast.success('Kullanıcı atıldı');
      } else {
        toast.error('Kullanıcı atılamadı');
      }
    });
  };

  const handleCopyLink = async () => {
    const link = generateRoomLink(roomId);
    const success = await copyToClipboard(link);
    if (success) {
      toast.success('Oda linki kopyalandı!');
    }
  };

  const handleLeaveRoom = () => {
    if (isInCall) {
      endCall();
      setIsInCall(false);
    }
    socket?.emit('leaveRoom', { roomId });
    clearRoom();
    navigate('/');
  };

  const handleJoinCall = async () => {
    try {
      toast.loading('Mikrofon izni isteniyor...', { id: 'join-call' });
      await initializeMedia(false); // Sadece mikrofon
      setIsInCall(true);
      toast.success('Çağrıya katıldınız! Kamerayı açmak için butona tıklayın.', { id: 'join-call' });
    } catch (error) {
      toast.error('Mikrofon erişimi reddedildi', { id: 'join-call' });
      console.error('Media error:', error);
    }
  };

  const handleLeaveCall = () => {
    endCall();
    setIsInCall(false);
    toast.success('Çağrıdan ayrıldınız');
  };

  const handleToggleVideo = async () => {
    try {
      if (!videoEnabled) {
        toast.loading('Kamera izni isteniyor...', { id: 'camera' });
      }
      await toggleVideo();
      if (!videoEnabled) {
        toast.success('Kamera açıldı!', { id: 'camera' });
      }
    } catch (error) {
      toast.error('Kamera erişimi reddedildi', { id: 'camera' });
      console.error('Camera error:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{roomInfo?.name || roomId}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            className="h-8 w-8"
          >
            <FiCopy className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNameModal(true)}
          >
            <FiSettings className="w-4 h-4 mr-2" />
            İsim Değiştir
          </Button>
          {!isInCall ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleJoinCall}
              className="bg-green-600 hover:bg-green-700"
            >
              <FiPhoneIncoming className="w-4 h-4 mr-2" />
              Çağrıya Gir
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveCall}
            >
              <FiPhoneOutgoing className="w-4 h-4 mr-2" />
              Çağrıdan Ayrıl
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeaveRoom}
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <FiPhoneOff className="w-4 h-4 mr-2" />
            Odadan Ayrıl
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT - Video Grid (Küçük) */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="flex-1 p-3 overflow-auto">
            {isInCall ? (
              <VideoGrid
                localStream={localStream}
                peers={peers}
                users={users}
                currentUserId={currentUserId}
                audioEnabled={audioEnabled}
                videoEnabled={videoEnabled}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground p-4">
                  <FiVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Çağrıya katılmadınız</p>
                  <p className="text-xs mt-1">Katılmak için üstteki butona tıklayın</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER - Chat (Büyük, Ana Alan) */}
        <div className="flex-1 flex flex-col bg-background">
          <div className="p-4 border-b bg-card">
            <h3 className="font-semibold text-lg">💬 Sohbet</h3>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <FiSend className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">Henüz mesaj yok</p>
                  <p className="text-sm">Konuşmaya başla!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = msg.from === currentUserId;
                const msgIsOwner = msg.role === 'owner';
                
                return (
                  <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {msg.name}
                        </span>
                        {msgIsOwner && <FaCrown className="w-3.5 h-3.5 text-yellow-500" />}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isSelf
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-card">
            <div className="flex gap-3">
              <Input
                placeholder="Mesaj yaz..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 h-12 text-base"
              />
              <Button
                size="lg"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="px-6"
              >
                <FiSend className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT - Users + Audio Controls */}
        <div className="w-80 border-l bg-card flex flex-col">
          
          {/* Audio Controls - Top (Only show when in call) */}
          {isInCall && (
            <>
              <div className="p-4 border-b">
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Ses & Video Kontrolleri</h3>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant={audioEnabled ? "default" : "destructive"}
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={toggleAudio}
                    title={audioEnabled ? 'Sustur' : 'Sesi aç'}
                  >
                    {audioEnabled ? <FiMic className="w-6 h-6" /> : <FiMicOff className="w-6 h-6" />}
                  </Button>

                  <Button
                    variant={videoEnabled ? "default" : "destructive"}
                    size="icon"
                    className="h-14 w-14 rounded-full"
                    onClick={handleToggleVideo}
                    title={videoEnabled ? 'Kamerayı kapat' : 'Kamerayı aç'}
                  >
                    {videoEnabled ? <FiVideo className="w-6 h-6" /> : <FiVideoOff className="w-6 h-6" />}
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Users List */}
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Katılımcılar
              </h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {users.length}
              </span>
            </div>
            
            <div className="space-y-2">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const userIsOwner = user.role === 'owner';
                
                return (
                  <Card key={user.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarFallback className="text-sm font-semibold bg-primary/10">
                            {(user.name || 'G')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold truncate">
                              {user.name || 'Guest'}
                            </span>
                            {userIsOwner && <FaCrown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                          </div>
                          {isSelf && (
                            <span className="text-xs text-muted-foreground">
                              (Sen)
                            </span>
                          )}
                        </div>

                        {/* Microphone Status */}
                        <div className="flex items-center gap-1">
                          {isSelf ? (
                            audioEnabled ? (
                              <div className="bg-green-500/20 p-1.5 rounded-full">
                                <FiMic className="w-3.5 h-3.5 text-green-600" />
                              </div>
                            ) : (
                              <div className="bg-red-500/20 p-1.5 rounded-full">
                                <FiMicOff className="w-3.5 h-3.5 text-red-600" />
                              </div>
                            )
                          ) : (
                            <div className="bg-green-500/20 p-1.5 rounded-full">
                              <FiMic className="w-3.5 h-3.5 text-green-600" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isOwner && !isSelf && !userIsOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-2"
                          onClick={() => handleKickUser(user.id)}
                        >
                          <FiUserX className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">İsim Değiştir</h2>
              <Input
                placeholder="İsminizi girin"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChangeName()}
                maxLength={20}
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNameModal(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button onClick={handleChangeName} className="flex-1">
                  Kaydet
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Room;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from '@services/socket';
import { useWebRTC } from '@hooks/useWebRTC';
import { useRoomStore } from '@store/roomStore';
import { useTheme } from '@contexts/ThemeContext';
import VideoGrid from '@components/VideoGrid';
import UserBubbles from '@components/UserBubbles';
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

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const password = location.state?.password || '';
  const isCreator = location.state?.isCreator || false;
  const { isDark, toggleTheme } = useTheme();

  const [socket, setSocket] = useState(null);
  const [userName, setUserName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [editingUserName, setEditingUserName] = useState('');

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

    // First get room info to check ownership
    socketInstance.emit('getRoomInfo', { roomId }, (infoResponse) => {
      if (!infoResponse.success) {
        toast.error('Oda bulunamadı');
        navigate('/');
        return;
      }

      setIsOwner(infoResponse.isOwner);
      setCurrentUserId(socketInstance.id);
      setUsers(infoResponse.users);

      // Then join the room
      socketInstance.emit('joinRoom', { roomId, password }, (joinResponse) => {
        if (!joinResponse.success) {
          toast.error(joinResponse.message || 'Odaya katılamadı');
          navigate('/');
          return;
        }

        setRoomInfo(joinResponse.room);
        
        // Show appropriate toast based on whether user is creator or joining
        if (isCreator) {
          toast.success('Oda oluşturuldu! Çağrıya katılmak için butona tıklayın.', {
            id: 'room-joined',
            duration: 3000
          });
        } else {
          toast.success('Odaya katıldınız! Çağrıya katılmak için butona tıklayın.', {
            id: 'room-joined',
            duration: 3000
          });
        }
      });
    });

    socketInstance.on('roomUsers', (roomUsers) => setUsers(roomUsers));
    socketInstance.on('receiveMessage', (message) => addMessage(message));
    socketInstance.on('kicked', () => {
      toast.error('Odadan atıldınız');
      handleLeaveRoom();
    });
    socketInstance.on('banned', () => {
      toast.error('Odadan banlandınız');
      handleLeaveRoom();
    });
    socketInstance.on('nameChanged', ({ newName }) => {
      toast.info(`İsminiz "${newName}" olarak değiştirildi`);
    });
    socketInstance.on('roomClosed', () => {
      toast.error('Oda kapatıldı');
      handleLeaveRoom();
    });

    return () => {
      socketInstance.off('roomUsers');
      socketInstance.off('receiveMessage');
      socketInstance.off('kicked');
      socketInstance.off('banned');
      socketInstance.off('nameChanged');
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
        setShowUserMenu(false);
      } else {
        toast.error('Kullanıcı atılamadı');
      }
    });
  };

  const handleBanUser = (targetSocketId) => {
    socket?.emit('banUser', { roomId, targetSocketId }, (response) => {
      if (response?.success) {
        toast.success('Kullanıcı banlandı');
        setShowUserMenu(false);
      } else {
        toast.error('Kullanıcı banlanamadı');
      }
    });
  };

  const handleChangeUserName = () => {
    if (!editingUserName.trim()) {
      toast.error('Lütfen bir isim girin');
      return;
    }
    socket?.emit('changeUserName', { 
      roomId, 
      targetSocketId: selectedUser, 
      newName: editingUserName 
    }, (response) => {
      if (response?.success) {
        toast.success('Kullanıcı ismi değiştirildi');
        setShowUserMenu(false);
        setEditingUserName('');
      } else {
        toast.error(response?.message || 'İsim değiştirilemedi');
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
      const stream = await initializeMedia(false); // Sadece mikrofon
      setIsInCall(true);
      toast.success('Çağrıya katıldınız! Kamerayı açmak için butona tıklayın.', { id: 'join-call' });
      
      // Trigger peer connections with existing users
      console.log('Media initialized, current users:', users);
      // Emit roomUsers request to trigger peer connections
      socket?.emit('getRoomInfo', { roomId }, (response) => {
        if (response.success) {
          console.log('Room info after join call:', response);
        }
      });
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
            aria-label={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
            title={isDark ? 'Aydınlık mod' : 'Karanlık mod'}
          >
            {isDark ? <FiSun className="w-5 h-5" aria-hidden="true" /> : <FiMoon className="w-5 h-5" aria-hidden="true" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNameModal(true)}
            aria-label="İsminizi değiştirin"
          >
            <FiSettings className="w-4 h-4 mr-2" aria-hidden="true" />
            İsim Değiştir
          </Button>
          {!isInCall ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleJoinCall}
              className="bg-green-600 hover:bg-green-700"
              aria-label="Video ve ses çağrısına katıl"
            >
              <FiPhoneIncoming className="w-4 h-4 mr-2" aria-hidden="true" />
              Çağrıya Gir
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveCall}
              aria-label="Video ve ses çağrısından ayrıl"
            >
              <FiPhoneOutgoing className="w-4 h-4 mr-2" aria-hidden="true" />
              Çağrıdan Ayrıl
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeaveRoom}
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            aria-label="Odadan tamamen ayrıl"
          >
            <FiPhoneOff className="w-4 h-4 mr-2" aria-hidden="true" />
            Odadan Ayrıl
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT - Video Grid + User Bubbles */}
        <div className="w-80 border-r bg-card flex flex-col">
          {/* User Bubbles */}
          <div className="border-b">
            <div className="p-3">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FiUsers className="w-4 h-4" />
                Üyeler ({users.length})
              </h3>
              <UserBubbles
                users={users}
                currentUserId={currentUserId}
                localStream={localStream}
                audioEnabled={audioEnabled}
                peers={peers}
              />
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 overflow-auto">
            <VideoGrid
              localStream={localStream}
              peers={peers}
              users={users}
              currentUserId={currentUserId}
              audioEnabled={audioEnabled}
              videoEnabled={videoEnabled}
            />
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
                aria-label="Mesaj yazın"
              />
              <Button
                size="lg"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="px-6"
                aria-label="Mesaj gönder"
              >
                <FiSend className="w-5 h-5" aria-hidden="true" />
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
                  <Card key={user.id} className="p-3 group">
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
                          className="h-8 w-8 ml-2 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            setSelectedUser(user.id);
                            setEditingUserName(user.name || '');
                            setShowUserMenu(true);
                          }}
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
                aria-label="Yeni kullanıcı adınız"
                aria-required="true"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNameModal(false)}
                  className="flex-1"
                  aria-label="İptal et"
                >
                  İptal
                </Button>
                <Button 
                  onClick={handleChangeName} 
                  className="flex-1"
                  aria-label="İsmi kaydet"
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* User Management Modal */}
      {showUserMenu && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUserMenu(false)}>
          <Card className="w-full max-w-sm bg-card border" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-4">Kullanıcı Yönetimi</h3>
              
              {/* Change Name */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground block mb-2" htmlFor="edit-user-name">İsim Değiştir</label>
                <div className="flex gap-2">
                  <Input
                    id="edit-user-name"
                    placeholder="Yeni isim"
                    value={editingUserName}
                    onChange={(e) => setEditingUserName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChangeUserName()}
                    maxLength={20}
                    className="flex-1"
                    aria-label="Kullanıcının yeni adı"
                  />
                  <Button 
                    onClick={handleChangeUserName}
                    size="sm"
                    aria-label="İsmi değiştir"
                  >
                    Değiştir
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => handleKickUser(selectedUser)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white justify-start"
                  aria-label="Kullanıcıyı odadan at"
                >
                  <FiUserX className="w-4 h-4 mr-2" aria-hidden="true" />
                  Kullanıcıyı At
                </Button>
                
                <Button
                  onClick={() => handleBanUser(selectedUser)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white justify-start"
                  aria-label="Kullanıcıyı kalıcı olarak banla"
                >
                  <FiUserX className="w-4 h-4 mr-2" aria-hidden="true" />
                  Kullanıcıyı Banla
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full"
                  aria-label="Kapat"
                >
                  İptal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

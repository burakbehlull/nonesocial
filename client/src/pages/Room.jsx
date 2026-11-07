import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from '@services/socket';
import { useWebRTC } from '@hooks/useWebRTC';
import { useRoomStore } from '@store/roomStore';
import { useTheme } from '@contexts/ThemeContext';
import VideoGrid from '@components/VideoGrid';
import UserBubbles from '@components/UserBubbles';
import ChatMessages from '@components/ChatMessages';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Separator } from '@components/ui/separator';
import { IconButton } from '@components/ui/icon-button';
import { Badge } from '@components/ui/badge';
import { 
  Copy, Settings, Users, Send, 
  Mic, MicOff, Video, VideoOff, 
  PhoneOff, Moon, Sun, UserX,
  PhoneIncoming, PhoneOutgoing, Crown,
  MessageSquare, MonitorUp
} from 'lucide-react';
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

    socketInstance.emit('getRoomInfo', { roomId }, (infoResponse) => {
      if (!infoResponse.success) {
        toast.error('Oda bulunamadı');
        navigate('/');
        return;
      }

      setIsOwner(infoResponse.isOwner);
      setCurrentUserId(socketInstance.id);
      setUsers(infoResponse.users);

      socketInstance.emit('joinRoom', { roomId, password }, (joinResponse) => {
        if (!joinResponse.success) {
          toast.error(joinResponse.message || 'Odaya katılamadı');
          navigate('/');
          return;
        }

        setRoomInfo(joinResponse.room);
        
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
      const stream = await initializeMedia(false);
      setIsInCall(true);
      toast.success('Çağrıya katıldınız!', { id: 'join-call' });
      
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
      {/* Premium Header */}
      <header className="border-b bg-card/50 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between shadow-premium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <MonitorUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">{roomInfo?.name || roomId}</h1>
              <p className="text-xs text-muted-foreground">{users.length} katılımcı</p>
            </div>
          </div>
          
          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleCopyLink}
            tooltip="Oda linkini kopyala"
          >
            <Copy className="w-4 h-4" />
          </IconButton>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            variant="ghost"
            onClick={toggleTheme}
            tooltip={isDark ? 'Aydınlık mod' : 'Karanlık mod'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </IconButton>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNameModal(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            İsim
          </Button>

          {!isInCall ? (
            <Button
              size="sm"
              onClick={handleJoinCall}
              className="bg-success hover:bg-success/90 text-success-foreground gap-2 shadow-premium"
            >
              <PhoneIncoming className="w-4 h-4" />
              Çağrıya Katıl
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveCall}
              className="gap-2 shadow-premium"
            >
              <PhoneOutgoing className="w-4 h-4" />
              Çağrıdan Ayrıl
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveRoom}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Odadan Ayrıl
          </Button>
        </div>
      </header>

      {/* Main Content - 3 Column Premium Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT - Compact Members & Video */}
        <aside className="w-72 border-r bg-card/30 flex flex-col">
          {/* Members Section */}
          <div className="border-b bg-card/50 backdrop-blur-sm">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Üyeler</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {users.length}
                </Badge>
              </div>
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
          <div className="flex-1 overflow-auto scrollbar-thin">
            <VideoGrid
              localStream={localStream}
              peers={peers}
              users={users}
              currentUserId={currentUserId}
              audioEnabled={audioEnabled}
              videoEnabled={videoEnabled}
            />
          </div>
        </aside>

        {/* CENTER - Chat (Main Focus) */}
        <main className="flex-1 flex flex-col bg-background">
          <div className="px-5 py-3.5 border-b bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Sohbet</h2>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ChatMessages messages={messages} currentUserId={currentUserId} />
          </div>

          {/* Message Input - Premium */}
          <div className="p-4 border-t bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Mesajınızı yazın..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="flex-1 h-11 bg-background border-border/50 focus-visible:ring-primary/20 shadow-sm"
                aria-label="Mesaj yazın"
              />
              <Button
                size="default"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="px-5 gap-2 shadow-premium"
                aria-label="Mesaj gönder"
              >
                <Send className="w-4 h-4" />
                Gönder
              </Button>
            </div>
          </div>
        </main>

        {/* RIGHT - Voice Controls & Participants */}
        <aside className="w-72 border-l bg-card/30 flex flex-col">
          
          {/* Voice Controls - Premium Card */}
          {isInCall && (
            <>
              <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
                <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Kontroller</h3>
                <div className="flex items-center justify-center gap-3">
                  <IconButton
                    variant={audioEnabled ? "success" : "destructive"}
                    size="lg"
                    onClick={toggleAudio}
                    tooltip={audioEnabled ? 'Sustur' : 'Sesi aç'}
                    className="shadow-premium-lg"
                  >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </IconButton>

                  <IconButton
                    variant={videoEnabled ? "primary" : "destructive"}
                    size="lg"
                    onClick={handleToggleVideo}
                    tooltip={videoEnabled ? 'Kamerayı kapat' : 'Kamerayı aç'}
                    className="shadow-premium-lg"
                  >
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </IconButton>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Participants List */}
          <div className="flex-1 overflow-auto p-4 scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Katılımcılar
              </h3>
              <Badge variant="secondary" className="text-xs">
                {users.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const userIsOwner = user.role === 'owner';
                
                return (
                  <Card key={user.id} className="p-3 hover:shadow-premium transition-all duration-200 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <Avatar className="h-9 w-9 border-2 border-primary/20">
                            <AvatarFallback className="text-xs font-semibold bg-primary/10">
                              {(user.name || 'G')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isSelf && audioEnabled && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {userIsOwner && <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                            <span className="text-sm font-medium truncate">
                              {user.name || 'Guest'}
                            </span>
                          </div>
                          {isSelf && (
                            <span className="text-xs text-muted-foreground">
                              Sen
                            </span>
                          )}
                        </div>

                        {/* Mic Status */}
                        <div>
                          {isSelf ? (
                            audioEnabled ? (
                              <div className="bg-success/10 p-1.5 rounded-full">
                                <Mic className="w-3.5 h-3.5 text-success" />
                              </div>
                            ) : (
                              <div className="bg-destructive/10 p-1.5 rounded-full">
                                <MicOff className="w-3.5 h-3.5 text-destructive" />
                              </div>
                            )
                          ) : (
                            <div className="bg-success/10 p-1.5 rounded-full">
                              <Mic className="w-3.5 h-3.5 text-success" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isOwner && !isSelf && !userIsOwner && (
                        <IconButton
                          variant="ghost"
                          size="sm"
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setSelectedUser(user.id);
                            setEditingUserName(user.name || '');
                            setShowUserMenu(true);
                          }}
                          tooltip="Kullanıcı yönetimi"
                        >
                          <UserX className="w-4 h-4 text-destructive" />
                        </IconButton>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Premium Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in" onClick={() => setShowNameModal(false)}>
          <Card className="w-full max-w-md shadow-premium-xl animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 gradient-text">İsim Değiştir</h2>
              <Input
                placeholder="İsminizi girin"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChangeName()}
                maxLength={20}
                autoFocus
                className="mb-4"
                aria-label="Yeni kullanıcı adınız"
                aria-required="true"
              />
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowNameModal(false)}
                  className="flex-1"
                  aria-label="İptal et"
                >
                  İptal
                </Button>
                <Button 
                  onClick={handleChangeName} 
                  className="flex-1 shadow-premium"
                  aria-label="İsmi kaydet"
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Premium User Management Modal */}
      {showUserMenu && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in" onClick={() => setShowUserMenu(false)}>
          <Card className="w-full max-w-sm shadow-premium-xl animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 gradient-text">Kullanıcı Yönetimi</h3>
              
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
                    className="shadow-premium"
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
                  variant="outline"
                  className="w-full justify-start gap-2 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                  aria-label="Kullanıcıyı odadan at"
                >
                  <UserX className="w-4 h-4" />
                  Kullanıcıyı At
                </Button>
                
                <Button
                  onClick={() => handleBanUser(selectedUser)}
                  variant="destructive"
                  className="w-full justify-start gap-2 shadow-premium"
                  aria-label="Kullanıcıyı kalıcı olarak banla"
                >
                  <UserX className="w-4 h-4" />
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

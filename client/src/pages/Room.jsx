import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from '@services/socket';
import { useSocketAudio } from '@hooks/useSocketAudio';
import { useTypingIndicator } from '@hooks/useTypingIndicator';
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';
import { useRoomStore } from '@store/roomStore';
import { useTheme } from '@contexts/ThemeContext';
import UserBubbles from '@components/UserBubbles';
import ChatMessages from '@components/ChatMessages';
import MentionAutocomplete from '@components/MentionAutocomplete';
import TypingIndicator from '@components/TypingIndicator';
import SettingsModal from '@components/SettingsModal';
import ShortcutsHelpModal from '@components/ShortcutsHelpModal';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Separator } from '@components/ui/separator';
import { IconButton } from '@components/ui/icon-button';
import { Badge } from '@components/ui/badge';
import { 
  Copy, Settings, Users, Send, 
  Mic, MicOff, 
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [editingUserName, setEditingUserName] = useState('');
  
  // 🔥 Settings & Shortcuts Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // 🔥 Mention System State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const messageInputRef = useRef(null);

  const {
    roomInfo,
    messages,
    users: storeUsers, // Store'dan gelen users'ı storeUsers olarak al
    isOwner,
    currentUserId: storeCurrentUserId, // Store'dan gelen ID (kullanmayacağız)
    setRoomInfo,
    setIsOwner,
    setCurrentUserId: setStoreCurrentUserId,
    setUsers,
    addMessage,
    clearRoom
  } = useRoomStore();

  // ✅ ÖNCE currentUserId'yi tanımla
  const currentUserId = localStorage.getItem('userId');

  const {
    audioEnabled,
    users: rawUsers, // Socket Audio'dan gelen gerçek zamanlı users
    inCall: isInCall,
    toggleAudio,
    joinCall,
    leaveCall
  } = useSocketAudio(roomId);
  
  // 🔥 Typing Indicator Hook
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(roomId, 3000);
  
  // 🔥 Keyboard Shortcuts Hook
  const { shortcuts } = useKeyboardShortcuts({
    onToggleMic: () => {
      if (isInCall) {
        toggleAudio();
      } else {
        toast.error('Önce çağrıya katılmalısınız');
      }
    },
    onToggleVideo: () => {
      // Video toggle (future feature)
      toast('Video özelliği yakında eklenecek', { icon: '🎥' });
    },
    onToggleScreenShare: () => {
      // Screen share (future feature)
      toast('Ekran paylaşımı yakında eklenecek', { icon: '🖥️' });
    },
    onShowHelp: () => {
      setShowShortcutsHelp(true);
    },
    onCloseModal: () => {
      // Close any open modal
      setShowSettingsModal(false);
      setShowShortcutsHelp(false);
      setShowNameModal(false);
      setShowUserMenu(false);
    },
    onSearch: () => {
      // Search (future feature)
      toast('Arama özelliği yakında eklenecek', { icon: '🔍' });
    },
    disabled: false
  });
  
  // ⚠️ DUPLICATE FIX: Aynı currentUserId ile birden fazla user varsa sadece birini al
  const users = useMemo(() => {
    if (!rawUsers || rawUsers.length === 0) return [];
    
    // currentUserId'li user'ı bul
    const myUsers = rawUsers.filter(u => u.id === currentUserId);
    const otherUsers = rawUsers.filter(u => u.id !== currentUserId);
    
    if (myUsers.length > 1) {
      console.warn('⚠️ DUPLICATE USER DETECTED!', {
        currentUserId,
        duplicates: myUsers.map(u => ({ id: u.id, name: u.name, inCall: u.inCall }))
      });
      // Sadece ilkini al (veya inCall olanı tercih et)
      const preferredUser = myUsers.find(u => u.inCall) || myUsers[0];
      return [preferredUser, ...otherUsers];
    }
    
    return rawUsers;
  }, [rawUsers, currentUserId]);
  
  // Prevent double initialization in React Strict Mode
  const initialized = useRef(false);
  const [socketReady, setSocketReady] = useState(false);

  // Socket'in hazır olmasını bekle
  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);
    
    // Eğer userId varsa socket hazır
    if (localStorage.getItem('userId')) {
      console.log('✅ Socket ready with userId:', localStorage.getItem('userId'));
      setSocketReady(true);
    } else {
      // userId gelene kadar bekle
      console.log('⏳ Waiting for userId from auth-token...');
      const checkUserId = setInterval(() => {
        if (localStorage.getItem('userId')) {
          console.log('✅ UserId received:', localStorage.getItem('userId'));
          setSocketReady(true);
          clearInterval(checkUserId);
        }
      }, 100);
      
      // Timeout: 5 saniye sonra yine de devam et
      setTimeout(() => {
        clearInterval(checkUserId);
        if (!localStorage.getItem('userId')) {
          console.error('❌ UserId timeout! Continuing anyway...');
          setSocketReady(true);
        }
      }, 5000);
      
      return () => clearInterval(checkUserId);
    }
  }, []);

  useEffect(() => {
    // Socket hazır değilse bekle
    if (!socketReady) {
      console.log('⏳ Socket not ready yet...');
      return;
    }
    
    // React Strict Mode double render protection
    if (initialized.current) {
      console.log('⚠️ useEffect already ran, skipping...');
      return;
    }
    initialized.current = true;

    const socketInstance = getSocket();

    socketInstance.emit('getRoomInfo', { roomId }, (infoResponse) => {
      if (!infoResponse.success) {
        toast.error('Oda bulunamadı');
        navigate('/');
        return;
      }

      setIsOwner(infoResponse.isOwner);
      
      // Store'a da kaydet (ama kullanmayacağız, sadece backward compatibility için)
      const userId = localStorage.getItem('userId');
      setStoreCurrentUserId(userId);
      
      console.log('👤 Current User ID:', userId);

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

    socketInstance.on('receiveMessage', (message) => addMessage(message));
    
    // 🔥 Mention Notification
    socketInstance.on('mentioned', ({ message, mentionedBy }) => {
      const mentionerName = mentionedBy?.name || 'Birisi';
      toast.custom((t) => (
        <div 
          className={`${
            t.visible ? 'animate-in slide-in-from-top-5' : 'animate-out slide-out-to-top-5'
          } max-w-md w-full bg-gradient-to-r from-primary to-primary/90 shadow-xl rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-primary/20`}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
            <span className="text-xl font-bold text-white">
              {mentionerName[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {mentionerName} senden bahsetti
            </p>
            <p className="text-xs text-white/90 line-clamp-2 mt-0.5">
              {message.content}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ), {
        duration: 6000,
        position: 'top-right',
      });
    });
    
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
      socketInstance.off('receiveMessage');
      socketInstance.off('mentioned'); // 🔥 Mention event cleanup
      socketInstance.off('kicked');
      socketInstance.off('banned');
      socketInstance.off('nameChanged');
      socketInstance.off('roomClosed');
      
      // ❌ KALDIRDIK: initialized'ı sıfırlama
      // initialized.current = false;
      // Çünkü: Strict Mode cleanup sonrası tekrar çalışınca
      // false oluyor ve duplicate engeli çalışmıyor!
    };
  }, [roomId, socketReady]); // ← socketReady dependency eklendi

  const handleSendMessage = () => {
    if (!messageInput.trim() || !socket) return;
    
    // Stop typing indicator when sending
    stopTyping();
    
    socket.emit('sendMessage', { roomId, message: messageInput }, (response) => {
      if (response?.success) {
        setMessageInput('');
        setShowMentions(false); // Mention dropdown'ı kapat
      } else {
        toast.error('Mesaj gönderilemedi');
      }
    });
  };

  // 🔥 Mention System: @ karakterini algıla
  const handleMessageInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessageInput(value);

    // 🔥 Typing indicator: Start typing on input
    if (value.trim().length > 0) {
      startTyping();
    } else {
      stopTyping();
    }

    // @ karakterini ara
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // @ sonrasında boşluk yoksa ve @ en son karakterse
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionQuery(textAfterAt.toLowerCase());
        setMentionStartPos(lastAtIndex);
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // 🔥 Mention System: Filtrelenmiş kullanıcı listesi
  const filteredUsers = useMemo(() => {
    if (!showMentions) return [];
    
    return users.filter(user => {
      // Kendini hariç tut
      if (user.id === currentUserId) return false;
      
      // İsim veya ID'ye göre ara
      const nameMatch = user.name?.toLowerCase().includes(mentionQuery);
      const idMatch = user.id?.toLowerCase().includes(mentionQuery);
      
      return nameMatch || idMatch;
    });
  }, [showMentions, users, mentionQuery, currentUserId]);

  // 🔥 Mention System: Keyboard navigation
  const handleMessageInputKeyDown = (e) => {
    if (!showMentions || filteredUsers.length === 0) {
      // Normal enter işlemi
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
      return;
    }

    // Mention dropdown açıkken klavye kontrolü
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        handleMentionSelect(filteredUsers[selectedMentionIndex]);
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowMentions(false);
        break;
      
      default:
        break;
    }
  };

  // 🔥 Mention System: Mention seçimi
  const handleMentionSelect = (user) => {
    if (!user) return;
    
    const beforeMention = messageInput.slice(0, mentionStartPos);
    const afterMention = messageInput.slice(messageInputRef.current?.selectionStart || messageInput.length);
    
    // @username formatında ekle, sonuna boşluk ekle
    const newMessage = `${beforeMention}@${user.name} ${afterMention}`;
    setMessageInput(newMessage);
    setShowMentions(false);
    
    // Input'a focus geri dön ve cursor'ı mention sonrasına koy
    setTimeout(() => {
      if (messageInputRef.current) {
        const newCursorPos = beforeMention.length + user.name.length + 2; // +1 for @, +1 for space
        messageInputRef.current.focus();
        messageInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // 🔥 Expose setSelectedMentionIndex for mouse hover
  useEffect(() => {
    window.selectedMentionIndexSetter = setSelectedMentionIndex;
    return () => {
      window.selectedMentionIndexSetter = null;
    };
  }, []);

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
      
      // Socket Audio ile çağrıya katıl
      await joinCall();
      
      toast.success('Çağrıya katıldınız! Mikrofonunuz açık.', { 
        id: 'join-call',
        duration: 2000 
      });
    } catch (error) {
      toast.error('Mikrofon erişimi reddedildi', { id: 'join-call' });
      console.error('Media error:', error);
    }
  };

  const handleLeaveCall = () => {
    leaveCall();
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
      {/* Premium Header - Mobile Responsive */}
      <header className="border-b bg-card/50 backdrop-blur-xl px-3 md:px-6 py-2.5 md:py-3.5 flex items-center justify-between shadow-premium">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex-shrink-0">
              <MonitorUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-base font-semibold tracking-tight truncate">{roomInfo?.name || roomId}</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">{users.length} katılımcı</p>
            </div>
          </div>
          
          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleCopyLink}
            tooltip="Oda linkini kopyala"
            className="hidden sm:flex"
          >
            <Copy className="w-4 h-4" />
          </IconButton>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* User ID Badge - Desktop Only */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">ID:</span>
            </div>
            <code className="text-xs font-mono font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded">
              {currentUserId?.slice(0, 8) || '--------'}
            </code>
            <IconButton
              variant="ghost"
              size="xs"
              className="h-6 w-6"
              onClick={() => {
                copyToClipboard(currentUserId);
                toast.success('Kullanıcı ID\'niz kopyalandı!', { duration: 2000 });
              }}
              tooltip="ID'yi kopyala"
            >
              <Copy className="w-3 h-3" />
            </IconButton>
          </div>

          {/* Settings Button */}
          <IconButton
            variant="ghost"
            onClick={() => setShowSettingsModal(true)}
            tooltip="Ayarlar (Klavye kısayolları)"
            className="hidden sm:flex"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </IconButton>

          {/* Theme Toggle */}
          <IconButton
            variant="ghost"
            onClick={toggleTheme}
            tooltip={isDark ? 'Aydınlık mod' : 'Karanlık mod'}
            className="hidden md:flex"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </IconButton>

          {/* Name Button - Hidden on small mobile */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNameModal(true)}
            className="gap-2 hidden sm:flex"
          >
            <span className="hidden md:inline">İsim Değiştir</span>
            <span className="md:hidden">İsim</span>
          </Button>

          {/* Call Buttons - Responsive */}
          {!isInCall ? (
            <Button
              size="sm"
              onClick={handleJoinCall}
              className="bg-success hover:bg-success/90 text-success-foreground gap-1 md:gap-2 shadow-premium text-xs md:text-sm px-2 md:px-4"
            >
              <PhoneIncoming className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Çağrıya Katıl</span>
              <span className="sm:hidden">Katıl</span>
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveCall}
              className="gap-1 md:gap-2 shadow-premium text-xs md:text-sm px-2 md:px-4"
            >
              <PhoneOutgoing className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Ayrıl</span>
            </Button>
          )}

          {/* Leave Room - Icon only on mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveRoom}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 md:gap-2 px-2 md:px-4"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden lg:inline">Odadan Ayrıl</span>
          </Button>
        </div>
      </header>

      {/* Main Content - Responsive Layout: Mobile Stack, Desktop 3-Column */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT - Compact Members & Voice Chat - Collapsible on Mobile */}
        <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r bg-card/30 flex flex-col max-h-[40vh] md:max-h-none">
          {/* Members Section */}
          <div className="border-b bg-card/50 backdrop-blur-sm">
            <div className="p-2 md:p-3">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                <h3 className="text-xs md:text-sm font-semibold">Üyeler</h3>
                <Badge variant="secondary" className="ml-auto text-[10px] md:text-xs">
                  {users.length}
                </Badge>
              </div>
              <UserBubbles
                users={users}
                currentUserId={currentUserId}
                audioEnabled={audioEnabled}
                isInCall={isInCall}
              />
            </div>
          </div>

          {/* Voice Chat Users - Hidden on Mobile when Empty */}
          <div className={`flex-1 overflow-auto scrollbar-thin p-2 md:p-4 ${
            users.filter(u => u.inCall).length === 0 ? 'hidden md:block' : ''
          }`}>
            {/* Header - Her zaman göster */}
            <div className="flex flex-col items-center gap-3 pb-3 border-b border-border/50 mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                users.filter(u => u.inCall).length > 0 
                  ? 'bg-primary/10' 
                  : 'bg-muted/20'
              }`}>
                <Mic className={`w-8 h-8 ${
                  users.filter(u => u.inCall).length > 0 
                    ? 'text-primary animate-pulse' 
                    : 'text-muted-foreground/40'
                }`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Sesli Sohbet</p>
                <p className="text-xs text-muted-foreground">
                  {users.filter(u => u.inCall).length} kişi çağrıda
                </p>
              </div>
            </div>

            {/* Çağrıdaki kullanıcılar */}
            {users.filter(u => u.inCall).length > 0 ? (
              <div className="space-y-3">
                {/* Kendin (eğer çağrıdaysan) - ÖNCELİKLİ */}
                {isInCall && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                      Sen
                    </p>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30">
                      <Avatar className="h-11 w-11 border-2 border-primary ring-2 ring-primary/20">
                        <AvatarFallback className="text-sm font-bold bg-primary/30">
                          {(users.find(u => u.id === currentUserId)?.name || 'S')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {users.find(u => u.id === currentUserId)?.role === 'owner' && (
                            <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-semibold truncate">
                            {users.find(u => u.id === currentUserId)?.name}
                          </span>
                        </div>
                        <code className="text-[9px] text-muted-foreground/70 font-mono">
                          {currentUserId?.slice(0, 8)}
                        </code>
                      </div>
                      
                      {/* Mikrofon Kontrolü - Sadece kendin için */}
                      <button
                        onClick={toggleAudio}
                        className={`p-2.5 rounded-full transition-all ${
                          audioEnabled 
                            ? 'bg-success hover:bg-success/80 shadow-lg shadow-success/20' 
                            : 'bg-destructive hover:bg-destructive/80 shadow-lg shadow-destructive/20'
                        }`}
                      >
                        {audioEnabled ? (
                          <Mic className="w-5 h-5 text-white" />
                        ) : (
                          <MicOff className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Diğer kullanıcılar (çağrıdakiler) */}
                {users.filter(u => u.inCall && u.id !== currentUserId).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                      Diğer Katılımcılar
                    </p>
                    <div className="space-y-2">
                      {users.filter(u => u.inCall && u.id !== currentUserId).map((user) => (
                        <div 
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all"
                        >
                          <Avatar className="h-10 w-10 border-2 border-success/40 ring-2 ring-success/10">
                            <AvatarFallback className="text-sm font-semibold bg-success/20">
                              {(user.name || 'G')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {user.role === 'owner' && (
                                <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium truncate">
                                {user.name}
                              </span>
                            </div>
                            <code className="text-[9px] text-muted-foreground/70 font-mono">
                              {user.id.slice(0, 8)}
                            </code>
                          </div>
                          
                          {/* Mikrofon Durumu - Read-only (başkası için) */}
                          <div className={`p-2 rounded-full ${
                            user.micEnabled === false // Backend'den gelecek
                              ? 'bg-destructive/20'
                              : 'bg-success/20'
                          }`}>
                            {user.micEnabled === false ? (
                              <MicOff className="w-4 h-4 text-destructive" />
                            ) : (
                              <Mic className="w-4 h-4 text-success" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Kimse çağrıda değil */
              <div className="flex flex-col items-center justify-center text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Henüz kimse çağrıda değil
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  İlk katılan sen ol!
                </p>
              </div>
            )}

            {/* Çağrıya katılma butonu (eğer katılmadıysan) */}
            {!isInCall && users.filter(u => u.inCall).length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Sesli sohbete katılmak için
                </p>
                <Button
                  size="sm"
                  onClick={handleJoinCall}
                  className="bg-success hover:bg-success/90 text-success-foreground gap-2 shadow-premium"
                >
                  <PhoneIncoming className="w-4 h-4" />
                  Çağrıya Katıl
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER - Chat (Main Focus) - Always Visible */}
        <main className="flex-1 flex flex-col bg-background min-h-0">
          <div className="px-3 md:px-5 py-2.5 md:py-3.5 border-b bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
              <h2 className="font-semibold text-xs md:text-sm">Sohbet</h2>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <ChatMessages messages={messages} currentUserId={currentUserId} />
            </div>
            
            {/* Typing Indicator */}
            <TypingIndicator 
              typingUsers={typingUsers} 
              currentUserId={currentUserId} 
            />
          </div>

          {/* Message Input - Premium with Mention Autocomplete - Mobile Responsive */}
          <div className="p-2 md:p-4 border-t bg-card/30 backdrop-blur-sm relative">
            {/* Mention Autocomplete Dropdown - Opens UPWARD */}
            {showMentions && (
              <div className="absolute bottom-full left-2 right-2 md:left-4 md:right-4 mb-2">
                {filteredUsers.length > 0 ? (
                  <MentionAutocomplete
                    users={filteredUsers}
                    selectedIndex={selectedMentionIndex}
                    onSelect={handleMentionSelect}
                    query={mentionQuery}
                  />
                ) : (
                  /* Empty State - Kullanıcı bulunamadı */
                  <div className="w-full md:w-72 bg-popover border border-border rounded-lg shadow-xl p-3 md:p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="text-center">
                      <p className="text-xs md:text-sm text-muted-foreground">
                        "{mentionQuery}" ile eşleşen kullanıcı bulunamadı
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground/70 mt-1">
                        İsim veya ID ile arayabilirsiniz
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 md:gap-3">
              <Input
                ref={messageInputRef}
                placeholder="Mesajınızı yazın..."
                value={messageInput}
                onChange={handleMessageInputChange}
                onKeyDown={handleMessageInputKeyDown}
                className="flex-1 h-9 md:h-11 text-sm md:text-base bg-background border-border/50 focus-visible:ring-primary/20 shadow-sm"
                aria-label="Mesaj yazın"
              />
              <Button
                size="default"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="px-3 md:px-5 gap-1 md:gap-2 shadow-premium h-9 md:h-11"
                aria-label="Mesaj gönder"
              >
                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Gönder</span>
              </Button>
            </div>
          </div>
        </main>

        {/* RIGHT - Voice Controls & Participants - Hidden on Mobile */}
        <aside className="hidden lg:flex w-72 border-l bg-card/30 flex-col">
          
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
              {/* Debug: User List */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-2 p-2 bg-blue-500/10 rounded text-[9px] font-mono space-y-1">
                  <div className="font-bold text-blue-600 dark:text-blue-400">SAĞ PANEL (Katılımcılar)</div>
                  <div>currentUserId: <span className="text-green-600">{currentUserId?.slice(0, 12)}</span></div>
                  <div>users.length: {users.length}</div>
                  <div className="mt-1 pt-1 border-t border-blue-500/20 text-[8px] space-y-0.5">
                    {users.map((u, i) => (
                      <div key={i} className={u.id === currentUserId ? 'text-green-600 font-bold' : ''}>
                        {i+1}. {u.name} | {u.id.slice(0, 10)} {u.id === currentUserId ? '✓SEN' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const userIsOwner = user.role === 'owner';
                const userInCall = user.inCall; // Çağrıda mı?
                
                return (
                  <Card key={user.id} className={`p-3 transition-all duration-200 group ${userInCall ? 'border-primary/30 bg-primary/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <Avatar className={`h-9 w-9 border-2 ${userInCall ? 'border-primary/40' : 'border-primary/20'}`}>
                            <AvatarFallback className="text-xs font-semibold bg-primary/10">
                              {(user.name || 'G')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator - sadece çağrıdaysa göster */}
                          {userInCall && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card animate-pulse-ring" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {userIsOwner && <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                            <span className="text-sm font-medium truncate">
                              {user.name || 'Guest'}
                            </span>
                            {!userInCall && (
                              <span className="text-xs text-muted-foreground">(Odada)</span>
                            )}
                          </div>
                          {/* User ID - Kopyalanabilir */}
                          <div className="flex items-center gap-1 mt-0.5">
                            {isSelf && (
                              <span className="text-xs text-muted-foreground mr-1">
                                Sen ·
                              </span>
                            )}
                            <code className="text-[10px] text-muted-foreground/70 font-mono bg-muted/30 px-1 py-0.5 rounded">
                              {user.id.slice(0, 8)}
                            </code>
                            <IconButton
                              variant="ghost"
                              size="xs"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                copyToClipboard(user.id);
                                toast.success('Kullanıcı ID kopyalandı!', { duration: 1500 });
                              }}
                              tooltip="ID'yi kopyala"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </IconButton>
                          </div>
                        </div>

                        {/* Mic Status - sadece çağrıdaysa göster */}
                        {userInCall && (
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
                        )}
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

      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        shortcuts={shortcuts}
      />
      
      {/* Shortcuts Help Modal (? key) */}
      <ShortcutsHelpModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={shortcuts}
      />

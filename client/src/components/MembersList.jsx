import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { FaCrown } from 'react-icons/fa';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone, FiPhoneOff } from 'react-icons/fi';
import VolumeControl from './VolumeControl';

const MemberItem = ({ user, isInCall, hasAudio, hasVideo, isCurrentUser, onVolumeClick, userVolume }) => {
  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={(e) => {
        // Kendine veya çağrıda olmayanlara tıklanırsa işlem yapma
        if (isCurrentUser || !isInCall) return;
        onVolumeClick?.(e, user);
      }}
      title={!isCurrentUser && isInCall ? 'Ses seviyesini ayarla' : ''}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-sm bg-primary/10">
            {(user.name || 'G')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Ses durumu göstergesi */}
        {isInCall && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
            {hasAudio ? (
              <FiMic className="w-2 h-2 text-white" />
            ) : (
              <FiMicOff className="w-2 h-2 text-white" />
            )}
          </div>
        )}
        
        {/* Volume Indicator - Sadece seste olanlara ve kendisi değilse */}
        {isInCall && !isCurrentUser && (
          <div className="absolute -top-0.5 -left-0.5 bg-background rounded-full p-0.5 shadow-sm border border-border">
            <div className="relative w-3.5 h-3.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/70 transition-all duration-300"
                style={{ height: `${userVolume / 2}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[6px] font-bold text-foreground drop-shadow">
                  {userVolume === 0 ? '🔇' : userVolume >= 150 ? '📢' : '🔊'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {!isInCall && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* İsim ve durum */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">
            {user.name || 'Guest'}
            {isCurrentUser && ' (Sen)'}
          </span>
          {user.role === 'owner' && (
            <FaCrown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        
        {/* Durum metni */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isInCall ? (
            <>
              <FiPhone className="w-3 h-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Seste</span>
            </>
          ) : (
            <>
              <FiPhoneOff className="w-3 h-3" />
              <span>Çevrimdışı</span>
            </>
          )}
        </div>
      </div>

      {/* Video durumu */}
      {isInCall && (
        <div className="flex items-center gap-1">
          {hasVideo ? (
            <FiVideo className="w-4 h-4 text-green-500" title="Kamera açık" />
          ) : (
            <FiVideoOff className="w-4 h-4 text-gray-400" title="Kamera kapalı" />
          )}
        </div>
      )}
    </div>
  );
};

const MembersList = ({ 
  users = [], 
  currentUserId, 
  localStream,
  audioEnabled,
  videoEnabled,
  peers 
}) => {
  const [volumeControlUser, setVolumeControlUser] = useState(null);
  const [volumeControlPosition, setVolumeControlPosition] = useState({ x: 0, y: 0 });
  const [userVolumes, setUserVolumes] = useState({}); // { userId: volume }

  const handleVolumeClick = (event, user) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setVolumeControlPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom
    });
    setVolumeControlUser(user);
  };

  const handleVolumeChange = (userId, volume) => {
    setUserVolumes(prev => ({
      ...prev,
      [userId]: volume
    }));
    
    // LocalStorage'a kaydet (persist için)
    localStorage.setItem(`volume_${userId}`, volume.toString());
    
    console.log(`🔊 Ses seviyesi değişti: ${userId.slice(0, 8)} → ${volume}%`);
  };

  const handleCloseVolumeControl = () => {
    setVolumeControlUser(null);
  };

  // LocalStorage'dan kullanıcı ses seviyelerini yükle
  useEffect(() => {
    const loadedVolumes = {};
    users.forEach(user => {
      const savedVolume = localStorage.getItem(`volume_${user.id}`);
      if (savedVolume) {
        loadedVolumes[user.id] = parseInt(savedVolume);
      }
    });
    setUserVolumes(loadedVolumes);
  }, [users.map(u => u.id).join(',')]); // users değişince yükle
  
  // Kullanıcının ses durumunu kontrol et
  const getUserCallStatus = (userId) => {
    // Kendimiz miyiz?
    if (userId === currentUserId) {
      return {
        isInCall: !!localStream,
        hasAudio: audioEnabled,
        hasVideo: videoEnabled
      };
    }
    
    // Karşı taraf
    const hasPeer = !!peers[userId];
    return {
      isInCall: hasPeer,
      hasAudio: hasPeer,  // Peer varsa ses var sayıyoruz
      hasVideo: hasPeer   // Video durumunu stream'den alabiliriz
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Volume Control Popover */}
      {volumeControlUser && (
        <VolumeControl
          userId={volumeControlUser.id}
          userName={volumeControlUser.name}
          volume={userVolumes[volumeControlUser.id] || 100}
          onVolumeChange={handleVolumeChange}
          position={volumeControlPosition}
          onClose={handleCloseVolumeControl}
        />
      )}
      
      {/* Başlık */}
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <FiPhone className="w-4 h-4" />
          Üyeler — {users.length}
        </h3>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {users.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Henüz üye yok
          </div>
        ) : (
          users.map(user => {
            const { isInCall, hasAudio, hasVideo } = getUserCallStatus(user.id);
            const userVolume = userVolumes[user.id] || 100;
            
            return (
              <MemberItem
                key={user.id}
                user={user}
                isInCall={isInCall}
                hasAudio={hasAudio}
                hasVideo={hasVideo}
                isCurrentUser={user.id === currentUserId}
                onVolumeClick={handleVolumeClick}
                userVolume={userVolume}
              />
            );
          })
        )}
      </div>

      {/* İstatistikler */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>
                {users.filter(u => {
                  const { isInCall } = getUserCallStatus(u.id);
                  return isInCall;
                }).length} Seste
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>
                {users.filter(u => {
                  const { isInCall } = getUserCallStatus(u.id);
                  return !isInCall;
                }).length} Çevrimdışı
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersList;

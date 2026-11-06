import { Avatar, AvatarFallback } from './ui/avatar';
import { FaCrown } from 'react-icons/fa';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone, FiPhoneOff } from 'react-icons/fi';

const MemberItem = ({ user, isInCall, hasAudio, hasVideo, isCurrentUser }) => {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
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
            
            return (
              <MemberItem
                key={user.id}
                user={user}
                isInCall={isInCall}
                hasAudio={hasAudio}
                hasVideo={hasVideo}
                isCurrentUser={user.id === currentUserId}
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

import { Avatar, AvatarFallback } from './ui/avatar';
import { FaCrown } from 'react-icons/fa';
import { FiMic, FiMicOff } from 'react-icons/fi';

const UserBubble = ({ user, isInCall, hasAudio, isCurrentUser }) => {
  return (
    <div className="flex flex-col items-center gap-1 p-2">
      {/* Avatar with status badge */}
      <div className="relative">
        <Avatar className="h-12 w-12 border-2 border-background">
          <AvatarFallback className="text-sm font-medium bg-primary/10">
            {(user.name || 'G')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Status badge */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${
          isInCall ? 'bg-green-500' : 'bg-gray-400'
        }`}>
          {isInCall && (
            hasAudio ? (
              <FiMic className="w-2.5 h-2.5 text-white" />
            ) : (
              <FiMicOff className="w-2.5 h-2.5 text-white" />
            )
          )}
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          {user.role === 'owner' && (
            <FaCrown className="w-2.5 h-2.5 text-yellow-500" />
          )}
          <span className="text-xs font-medium text-center truncate max-w-[60px]">
            {user.name || 'Guest'}
          </span>
        </div>
        {isCurrentUser && (
          <span className="text-[10px] text-muted-foreground">(Sen)</span>
        )}
      </div>
    </div>
  );
};

const UserBubbles = ({ 
  users = [], 
  currentUserId, 
  localStream,
  audioEnabled,
  peers 
}) => {
  const getUserCallStatus = (userId) => {
    if (userId === currentUserId) {
      return {
        isInCall: !!localStream,
        hasAudio: audioEnabled
      };
    }
    
    return {
      isInCall: !!peers[userId],
      hasAudio: !!peers[userId]
    };
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
      {users.map(user => {
        const { isInCall, hasAudio } = getUserCallStatus(user.id);
        
        return (
          <UserBubble
            key={user.id}
            user={user}
            isInCall={isInCall}
            hasAudio={hasAudio}
            isCurrentUser={user.id === currentUserId}
          />
        );
      })}
      
      {users.length === 0 && (
        <div className="text-sm text-muted-foreground text-center w-full py-4">
          Henüz kullanıcı yok
        </div>
      )}
    </div>
  );
};

export default UserBubbles;

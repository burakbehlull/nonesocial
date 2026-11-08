import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Crown, Mic, MicOff, Radio } from 'lucide-react';

const UserBubble = ({ user, isInCall, hasAudio, isCurrentUser }) => {
  return (
    <div className="flex flex-col items-center gap-2 p-2.5 rounded-xl hover:bg-muted/30 transition-all duration-200 group">
      {/* Avatar with animated status ring */}
      <div className="relative">
        <div className={`absolute -inset-1 rounded-full transition-all duration-300 ${
          isInCall 
            ? 'bg-gradient-to-r from-success to-primary opacity-75 blur-sm animate-pulse' 
            : 'bg-muted-foreground/20 opacity-0'
        }`} />
        <Avatar className="relative h-12 w-12 border-2 border-background shadow-premium">
          <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
            {(user.name || 'G')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Premium Status Badge */}
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background shadow-premium flex items-center justify-center transition-all duration-200 ${
          isInCall ? 'bg-gradient-to-br from-success to-success/80' : 'bg-muted-foreground/40'
        }`}>
          {isInCall && (
            hasAudio ? (
              <Mic className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            ) : (
              <MicOff className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            )
          )}
        </div>
      </div>

      {/* Name + Owner Badge */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          {user.role === 'owner' && (
            <Crown className="w-3 h-3 text-yellow-500" />
          )}
          <span className="text-xs font-semibold text-center truncate max-w-[70px]">
            {user.name || 'Guest'}
          </span>
        </div>
        
        {/* User ID - Compact & Clickable */}
        <div className="group/id relative">
          <code 
            className="text-[9px] text-muted-foreground/60 font-mono bg-muted/20 px-1.5 py-0.5 rounded cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(user.id);
              // Mini feedback - burada toast kullanmak yerine daha subtle bir şey yapabiliriz
            }}
            title={`ID: ${user.id} (Kopyalamak için tıkla)`}
          >
            {user.id.slice(0, 6)}
          </code>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover/id:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Kopyala
          </div>
        </div>
        
        {/* Status Text with animation */}
        <div className="flex items-center gap-1">
          {isInCall && <Radio className="w-2.5 h-2.5 text-success animate-pulse" />}
          <Badge 
            variant={isInCall ? "success" : "secondary"} 
            className="text-[10px] px-1.5 py-0 font-medium"
          >
            {isInCall ? 'Seste' : 'Odada'}
          </Badge>
        </div>
        
        {isCurrentUser && (
          <span className="text-[10px] text-muted-foreground font-medium">(Sen)</span>
        )}
      </div>
    </div>
  );
};

const UserBubbles = ({ 
  users = [], 
  currentUserId, 
  audioEnabled,
  isInCall: currentUserInCall = false
}) => {
  console.log('👥 UserBubbles render:', {
    usersCount: users.length,
    currentUserId,
    currentUserInCall,
    users: users.map(u => ({ id: u.id, name: u.name, inCall: u.inCall }))
  });

  const getUserCallStatus = (userId) => {
    // Kullanıcının inCall bilgisi backend'den geliyor
    const user = users.find(u => u.id === userId);
    
    if (userId === currentUserId) {
      return {
        isInCall: currentUserInCall,
        hasAudio: audioEnabled
      };
    }
    
    return {
      isInCall: user?.inCall || false,
      hasAudio: user?.inCall || false // Çağrıdaysa ses var kabul et
    };
  };

  const usersInCallCount = users.filter(user => user.inCall || (user.id === currentUserId && currentUserInCall)).length;

  return (
    <div className="space-y-3">
      {/* User Grid - Premium */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl border border-border/50">
        {users.length === 0 ? (
          <div className="col-span-3 text-xs text-muted-foreground text-center py-6">
            Henüz kullanıcı yok
          </div>
        ) : (
          users.map(user => {
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
          })
        )}
      </div>
      
      {/* Stats - Premium */}
      {users.length > 0 && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-success/5 rounded-lg border border-success/10">
          <Radio className="w-3.5 h-3.5 text-success animate-pulse" />
          <span className="text-xs font-semibold">
            <span className="text-success">{usersInCallCount}</span>
            {' '}
            <span className="text-muted-foreground">/ {users.length} seste</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default UserBubbles;

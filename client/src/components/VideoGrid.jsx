import { useEffect, useRef } from 'react';
import { MicOff, VideoOff, PhoneOff, Crown, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

const VideoTile = ({ stream, name, isSelf, audioEnabled, videoEnabled, isOwner }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20 border-border/50 aspect-video group hover:shadow-premium transition-all duration-300">
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-muted/30">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl" />
            <Avatar className="relative h-20 w-20 border-2 border-primary/30 shadow-premium-lg">
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                {(name || 'G')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}
      
      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
          {isOwner && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-premium">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
          <span className="text-white text-sm font-semibold truncate max-w-[120px] drop-shadow">
            {name || 'Guest'}
            {isSelf && ' (Sen)'}
          </span>
        </div>
        
        <div className="flex gap-1.5">
          {!audioEnabled && (
            <div className="glass bg-destructive/20 backdrop-blur-md p-1.5 rounded-full shadow-premium">
              <MicOff className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
          )}
          {!videoEnabled && (
            <div className="glass bg-destructive/20 backdrop-blur-md p-1.5 rounded-full shadow-premium">
              <VideoOff className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const VideoGrid = ({ localStream, peers, users, currentUserId, audioEnabled, videoEnabled }) => {
  const activeVideos = [];
  
  if (localStream) {
    activeVideos.push({
      stream: localStream,
      userId: currentUserId,
      isSelf: true,
      audioEnabled,
      videoEnabled
    });
  }
  
  Object.entries(peers).forEach(([userId, { stream }]) => {
    if (stream) {
      activeVideos.push({
        stream,
        userId,
        isSelf: false,
        audioEnabled: true,
        videoEnabled: true
      });
    }
  });
  
  const totalVideos = activeVideos.length;
  
  const getGridClass = () => {
    if (totalVideos === 0) return 'grid-cols-1';
    if (totalVideos === 1) return 'grid-cols-1';
    if (totalVideos === 2) return 'grid-cols-2';
    if (totalVideos <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Guest';
  };

  const isUserOwner = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.role === 'owner';
  };

  if (totalVideos === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted/10 to-muted/5 rounded-xl m-3 border border-dashed border-border/50">
        <div className="text-center text-muted-foreground p-8 max-w-sm">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 shadow-premium">
              <PhoneOff className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-base font-semibold text-foreground/80 mb-2">Henüz kimse seste değil</p>
          <p className="text-sm text-muted-foreground">Aramaya katılmak için <strong className="text-success">Çağrıya Katıl</strong> butonuna tıklayın</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-3 p-3",
      totalVideos === 1 && "h-full",
      totalVideos > 1 && "auto-rows-fr",
      getGridClass()
    )}>
      {activeVideos.map(({ stream, userId, isSelf, audioEnabled, videoEnabled }) => (
        <VideoTile
          key={userId}
          stream={stream}
          name={getUserName(userId)}
          isSelf={isSelf}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          isOwner={isUserOwner(userId)}
        />
      ))}
    </div>
  );
};

export default VideoGrid;

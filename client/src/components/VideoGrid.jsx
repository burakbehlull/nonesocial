import { useEffect, useRef } from 'react';
import { FiMicOff, FiVideoOff } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';

const VideoTile = ({ stream, name, isSelf, audioEnabled, videoEnabled, isOwner }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className="relative overflow-hidden bg-muted/50 border aspect-square group">
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-2xl">
              {(name || 'G')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
          <span className="text-white text-xs font-medium truncate max-w-[100px]">
            {name || 'Guest'}
            {isSelf && ' (Sen)'}
          </span>
          {isOwner && <FaCrown className="w-3 h-3 text-yellow-400" />}
        </div>
        
        <div className="flex gap-1">
          {!audioEnabled && (
            <div className="bg-red-500/90 backdrop-blur-sm p-1 rounded-full">
              <FiMicOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          {!videoEnabled && (
            <div className="bg-red-500/90 backdrop-blur-sm p-1 rounded-full">
              <FiVideoOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const VideoGrid = ({ localStream, peers, users, currentUserId, audioEnabled, videoEnabled }) => {
  const totalVideos = 1 + Object.keys(peers).length;
  
  const getGridClass = () => {
    if (totalVideos === 1) return 'grid-cols-1';
    if (totalVideos === 2) return 'grid-cols-1';
    if (totalVideos <= 4) return 'grid-cols-1';
    return 'grid-cols-2';
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Guest';
  };

  const isUserOwner = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.role === 'owner';
  };

  return (
    <div className={cn("grid gap-2 h-full", getGridClass())}>
      {/* Local video */}
      <VideoTile
        stream={localStream}
        name={getUserName(currentUserId)}
        isSelf={true}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isOwner={isUserOwner(currentUserId)}
      />

      {/* Remote videos */}
      {Object.entries(peers).map(([userId, { stream }]) => (
        <VideoTile
          key={userId}
          stream={stream}
          name={getUserName(userId)}
          isSelf={false}
          audioEnabled={true}
          videoEnabled={true}
          isOwner={isUserOwner(userId)}
        />
      ))}
    </div>
  );
};

export default VideoGrid;

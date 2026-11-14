import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Button } from '@components/ui/button';

/**
 * Voice Message Component
 * Displays a voice message with playback controls and waveform
 */
export default function VoiceMessage({ 
  message, 
  isOwnMessage, 
  userName 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.duration || 0);
  const audioRef = useRef(null);

  // Convert base64 audio data to blob URL
  const audioUrl = message.audioData;

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex gap-2 sm:gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-primary/10">
          <AvatarFallback className="text-xs sm:text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
            {(userName || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Voice Message Bubble */}
      <div
        className={`
          flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl max-w-xs sm:max-w-sm
          ${isOwnMessage 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
          }
        `}
      >
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayback}
          size="icon"
          variant="ghost"
          className={`
            h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0
            ${isOwnMessage 
              ? 'hover:bg-primary-foreground/20 text-primary-foreground' 
              : 'hover:bg-background/50'
            }
          `}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
          )}
        </Button>

        {/* Waveform and Time */}
        <div className="flex-1 min-w-0">
          {/* Waveform Progress Bar */}
          <div className="relative h-6 sm:h-8 flex items-center">
            <div className="absolute inset-0 flex items-center gap-0.5">
              {/* Simple waveform bars */}
              {Array.from({ length: 30 }).map((_, i) => {
                const heights = [0.3, 0.6, 0.8, 1, 0.7, 0.5, 0.4, 0.9, 0.6, 0.8];
                const height = heights[i % heights.length];
                const isPassed = (i / 30) * 100 <= progress;

                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-75 ${
                      isOwnMessage
                        ? isPassed 
                          ? 'bg-primary-foreground' 
                          : 'bg-primary-foreground/30'
                        : isPassed 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/30'
                    }`}
                    style={{ 
                      height: `${height * 100}%`,
                      minHeight: '2px'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Time Display */}
          <div className={`
            text-xs mt-1 font-mono
            ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}
          `}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
      </div>
    </div>
  );
}

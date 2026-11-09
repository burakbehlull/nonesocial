import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

const VolumeControl = ({ 
  userId, 
  userName, 
  volume = 100, 
  onVolumeChange,
  position = { x: 0, y: 0 },
  onClose 
}) => {
  const [localVolume, setLocalVolume] = useState(volume);
  const popoverRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleVolumeChange = (newVolume) => {
    setLocalVolume(newVolume);
    onVolumeChange?.(userId, newVolume);
  };

  const getVolumeIcon = () => {
    if (localVolume === 0) return <VolumeX className="w-4 h-4" />;
    if (localVolume < 50) return <Volume1 className="w-4 h-4" />;
    return <Volume2 className="w-4 h-4" />;
  };

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-64 bg-popover border border-border rounded-lg shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, 10px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          <span className="text-sm font-bold text-primary">
            {(userName || 'G')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{userName}</p>
          <p className="text-xs text-muted-foreground">Kullanıcı Ses Seviyesi</p>
        </div>
      </div>

      {/* Volume Slider */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            {getVolumeIcon()}
          </div>
          
          <div className="flex-1 relative">
            {/* Custom Range Slider */}
            <input
              type="range"
              min="0"
              max="200"
              value={localVolume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:transition-all
                [&::-moz-range-thumb]:hover:scale-110"
              style={{
                background: `linear-gradient(to right, 
                  hsl(var(--primary)) 0%, 
                  hsl(var(--primary)) ${localVolume / 2}%, 
                  hsl(var(--muted)) ${localVolume / 2}%, 
                  hsl(var(--muted)) 100%)`
              }}
            />
          </div>

          <span className="text-xs font-semibold text-muted-foreground w-10 text-right">
            {localVolume}%
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Hızlı:</span>
          {[0, 50, 100, 150, 200].map((preset) => (
            <button
              key={preset}
              onClick={() => handleVolumeChange(preset)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all ${
                localVolume === preset
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            {localVolume === 0 && '🔇 Sessize alındı'}
            {localVolume > 0 && localVolume < 100 && '🔉 Normal seviyenin altında'}
            {localVolume === 100 && '🔊 Normal ses seviyesi (varsayılan)'}
            {localVolume > 100 && localVolume <= 150 && '📢 Yükseltildi'}
            {localVolume > 150 && '🚨 Çok yüksek! Kulak sağlığınıza dikkat edin'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VolumeControl;

import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';
import { Button } from './ui/button';

const VideoControls = ({ 
  audioEnabled, 
  videoEnabled, 
  onToggleAudio, 
  onToggleVideo, 
  onEndCall 
}) => {
  return (
    <div className="border-t bg-card px-6 py-4 flex items-center justify-center gap-3">
      <Button
        variant={audioEnabled ? "outline" : "destructive"}
        size="icon"
        className="h-12 w-12 rounded-full"
        onClick={onToggleAudio}
        title={audioEnabled ? 'Sustur' : 'Sesi aç'}
      >
        {audioEnabled ? <FiMic className="w-5 h-5" /> : <FiMicOff className="w-5 h-5" />}
      </Button>

      <Button
        variant={videoEnabled ? "outline" : "destructive"}
        size="icon"
        className="h-12 w-12 rounded-full"
        onClick={onToggleVideo}
        title={videoEnabled ? 'Kamerayı kapat' : 'Kamerayı aç'}
      >
        {videoEnabled ? <FiVideo className="w-5 h-5" /> : <FiVideoOff className="w-5 h-5" />}
      </Button>

      <Button
        variant="destructive"
        size="icon"
        className="h-12 w-12 rounded-full"
        onClick={onEndCall}
        title="Aramayı sonlandır"
      >
        <FiPhoneOff className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default VideoControls;

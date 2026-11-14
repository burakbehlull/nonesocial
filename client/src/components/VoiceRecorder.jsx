import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';

const MAX_DURATION = 60; // 60 seconds

/**
 * Voice Recorder Component
 * Features:
 * - Record audio (max 60 seconds)
 * - Waveform visualization
 * - Playback controls
 * - Send or delete recording
 */
export default function VoiceRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveformData, setWaveformData] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup Audio Analyzer for waveform
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = { analyzer, audioContext };

      // Start waveform animation
      visualizeWaveform();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Stop waveform animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Visualize waveform
  const visualizeWaveform = () => {
    if (!analyzerRef.current) return;

    const { analyzer } = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyzer.getByteTimeDomainData(dataArray);

      // Sample data for waveform (reduce to ~50 bars)
      const samples = 50;
      const step = Math.floor(bufferLength / samples);
      const waveform = [];

      for (let i = 0; i < samples; i++) {
        const value = dataArray[i * step];
        const normalized = (value / 128) - 1; // -1 to 1
        waveform.push(Math.abs(normalized));
      }

      setWaveformData(waveform);
    };

    draw();
  };

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Delete recording
  const handleDelete = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setWaveformData([]);
    if (onCancel) onCancel();
  };

  // Send recording
  const handleSend = () => {
    if (audioBlob && onSend) {
      onSend(audioBlob, recordingTime);
      handleDelete();
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (analyzerRef.current) {
        analyzerRef.current.audioContext.close();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <Card className="p-4 space-y-4 border-primary/20 bg-card/50 backdrop-blur-sm">
      {/* Waveform Visualization */}
      <div className="h-24 sm:h-32 bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
        {waveformData.length > 0 || audioBlob ? (
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 h-full px-2 sm:px-4 w-full">
            {(waveformData.length > 0 ? waveformData : Array(50).fill(0.1)).map((amplitude, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-75 ${
                  isRecording ? 'bg-red-500' : 'bg-primary'
                }`}
                style={{
                  height: `${Math.max(amplitude * 100, 4)}%`,
                  minHeight: '4px'
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground px-4">
            <Mic className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">Kayıt başlatmak için butona tıklayın</p>
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-mono font-bold">
          {formatTime(recordingTime)}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">
          {isRecording ? 'Kaydediliyor...' : audioBlob ? 'Kayıt tamamlandı' : 'Maksimum 60 saniye'}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {!audioBlob ? (
          // Recording controls
          <>
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="rounded-full w-14 h-14 sm:w-16 sm:h-16"
              >
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="rounded-full w-14 h-14 sm:w-16 sm:h-16"
              >
                <Square className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            )}
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon"
              disabled={!isRecording && !audioBlob}
              className="rounded-full"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </>
        ) : (
          // Playback controls
          <>
            <Button
              onClick={togglePlayback}
              size="lg"
              variant="outline"
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
              )}
            </Button>
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              onClick={handleSend}
              size="lg"
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </>
        )}
      </div>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </Card>
  );
}

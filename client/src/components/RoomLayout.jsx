import { useState } from 'react';
import VideoGrid from './VideoGrid';
import MembersList from './MembersList';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FiSend, FiUsers, FiX } from 'react-icons/fi';

const RoomLayout = ({ 
  // WebRTC props
  localStream,
  peers,
  audioEnabled,
  videoEnabled,
  users,
  currentUserId,
  // Chat props
  messages,
  onSendMessage
}) => {
  const [showMembers, setShowMembers] = useState(true);
  const [messageInput, setMessageInput] = useState('');

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  return (
    <div className="flex h-full">
      {/* Sol: Video Grid */}
      <div className="flex-1 bg-background">
        <VideoGrid
          localStream={localStream}
          peers={peers}
          users={users}
          currentUserId={currentUserId}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
        />
      </div>

      {/* Sağ: Members + Chat */}
      <div className={`${showMembers ? 'w-80' : 'w-0'} border-l transition-all duration-300 overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-muted/30">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FiUsers className="w-4 h-4" />
            Oda Detayları
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMembers(false)}
            className="h-8 w-8 p-0"
            aria-label="Üye listesini gizle"
          >
            <FiX className="w-4 h-4" />
          </Button>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-hidden">
          <MembersList
            users={users}
            currentUserId={currentUserId}
            localStream={localStream}
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            peers={peers}
          />
        </div>

        {/* Chat */}
        <div className="border-t">
          {/* Messages */}
          <div className="h-48 overflow-y-auto p-3 space-y-2 bg-muted/10">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Henüz mesaj yok
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-medium">{msg.name}: </span>
                  <span className="text-muted-foreground">{msg.content}</span>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-muted/30">
            <div className="flex gap-2">
              <Input
                placeholder="Mesaj yaz..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
                aria-label="Mesaj"
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                disabled={!messageInput.trim()}
                aria-label="Gönder"
              >
                <FiSend className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle button (when hidden) */}
      {!showMembers && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMembers(true)}
          className="absolute top-4 right-4 h-10 w-10 p-0 rounded-full bg-background border shadow-lg"
          aria-label="Üye listesini göster"
        >
          <FiUsers className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default RoomLayout;

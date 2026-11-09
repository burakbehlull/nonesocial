import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Crown, MessageSquare } from 'lucide-react';

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 🔥 Mention parsing ve highlighting
const parseMentions = (content, mentions = [], currentUserId) => {
  if (!mentions || mentions.length === 0) {
    return <span>{content}</span>;
  }

  const parts = [];
  let lastIndex = 0;

  // Mentions'ı offset'e göre sırala
  const sortedMentions = [...mentions].sort((a, b) => a.offset - b.offset);

  sortedMentions.forEach((mention, index) => {
    // Mention öncesi text
    if (mention.offset > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {content.slice(lastIndex, mention.offset)}
        </span>
      );
    }

    // Mention - vurgulu
    const isSelfMention = mention.userId === currentUserId;
    parts.push(
      <span
        key={`mention-${index}`}
        className={`inline-flex items-center font-semibold px-1.5 py-0.5 rounded transition-all duration-200 cursor-pointer ${
          isSelfMention
            ? 'bg-primary/20 text-primary ring-1 ring-primary/30 hover:bg-primary/30 hover:ring-primary/50 hover:scale-105'
            : 'bg-muted text-foreground/90 hover:bg-muted/80 hover:text-foreground hover:scale-105'
        }`}
        title={`@${mention.name} (ID: ${mention.userId.slice(0, 8)})`}
        onClick={() => {
          // Future: Mention'a tıklayınca kullanıcı profiline git veya DM aç
          console.log('Clicked mention:', mention);
        }}
      >
        @{mention.name}
      </span>
    );

    lastIndex = mention.offset + mention.length;
  });

  // Kalan text
  if (lastIndex < content.length) {
    parts.push(
      <span key="text-end">{content.slice(lastIndex)}</span>
    );
  }

  return <>{parts}</>;
};

const ChatMessages = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Group consecutive messages from the same user
  const groupedMessages = [];
  let currentGroup = null;

  messages.forEach((msg, index) => {
    const prevMsg = messages[index - 1];
    const shouldGroup = prevMsg && prevMsg.from === msg.from;

    if (!shouldGroup) {
      if (currentGroup) {
        groupedMessages.push(currentGroup);
      }
      currentGroup = {
        userId: msg.from,
        userName: msg.name,
        role: msg.role,
        timestamp: msg.timestamp,
        messages: [msg]
      };
    } else {
      currentGroup.messages.push(msg);
    }
  });

  if (currentGroup) {
    groupedMessages.push(currentGroup);
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/5">
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <MessageSquare className="w-8 h-8 text-primary/50" />
          </div>
          <p className="text-base font-semibold text-foreground/70">Henüz mesaj yok</p>
          <p className="text-sm mt-2 text-muted-foreground">İlk mesajı gönderin!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef} 
      className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin"
    >
      {groupedMessages.map((group, groupIndex) => {
        const isOwner = group.role === 'owner';
        const isSelf = group.userId === currentUserId;

        return (
          <div 
            key={groupIndex} 
            className="flex gap-3 group animate-in"
          >
            {/* Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-primary/10">
              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                {(group.userName || 'G')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Messages */}
            <div className="flex-1 min-w-0 space-y-0.5">
              {/* Header - Name, Badge, Time */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">
                  {group.userName || 'Guest'}
                </span>
                {isOwner && (
                  <Badge variant="owner" className="text-[10px] px-1.5 py-0 gap-1">
                    <Crown className="w-2.5 h-2.5" />
                    Owner
                  </Badge>
                )}
                {isSelf && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Sen
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatTime(group.timestamp)}
                </span>
              </div>

              {/* Message Group - Premium Style with Mention Highlighting */}
              <div className="space-y-0.5">
                {group.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="text-[15px] leading-relaxed break-words px-3 py-1.5 rounded-lg hover:bg-muted/40 transition-colors duration-150"
                  >
                    {parseMentions(msg.content, msg.mentions, currentUserId)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Auto scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;

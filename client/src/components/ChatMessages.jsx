import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { FaCrown } from 'react-icons/fa';

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const ChatMessages = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto scroll to bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Group messages by user
  const groupedMessages = [];
  let currentGroup = null;

  messages.forEach((msg, index) => {
    const prevMsg = messages[index - 1];
    const shouldGroup = prevMsg && prevMsg.from === msg.from;

    if (!shouldGroup) {
      // New group
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
      // Add to current group
      currentGroup.messages.push(msg);
    }
  });

  // Push last group
  if (currentGroup) {
    groupedMessages.push(currentGroup);
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Henüz mesaj yok</p>
          <p className="text-sm mt-1 opacity-75">Konuşmaya başla!</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {groupedMessages.map((group, groupIndex) => {
        const isOwner = group.role === 'owner';

        return (
          <div key={groupIndex} className="flex gap-3">
            {/* Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="text-sm font-medium">
                {(group.userName || 'G')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Messages */}
            <div className="flex-1 min-w-0">
              {/* Header (sadece ilk mesajda) */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">
                  {group.userName}
                </span>
                {isOwner && (
                  <FaCrown className="w-3 h-3 text-yellow-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {formatTime(group.timestamp)}
                </span>
              </div>

              {/* Message list */}
              <div className="space-y-0.5">
                {group.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="text-sm leading-relaxed break-words hover:bg-muted/30 px-1 py-0.5 rounded"
                  >
                    {msg.content}
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

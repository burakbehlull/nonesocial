import { useMemo } from 'react';

/**
 * Typing Indicator Component
 * Displays "... yazıyor" animation with user names
 * 
 * @param {Array} typingUsers - Array of { userId, name } who are typing
 * @param {string} currentUserId - Current user's ID (to exclude from list)
 */
export default function TypingIndicator({ typingUsers = [], currentUserId }) {
  // Filter out current user and format names
  const typingNames = useMemo(() => {
    return typingUsers
      .filter(user => user.userId !== currentUserId)
      .map(user => user.name);
  }, [typingUsers, currentUserId]);

  if (typingNames.length === 0) {
    return null;
  }

  // Format text based on number of users
  const getTypingText = () => {
    if (typingNames.length === 1) {
      return `${typingNames[0]} yazıyor`;
    } else if (typingNames.length === 2) {
      return `${typingNames[0]} ve ${typingNames[1]} yazıyor`;
    } else if (typingNames.length === 3) {
      return `${typingNames[0]}, ${typingNames[1]} ve ${typingNames[2]} yazıyor`;
    } else {
      // More than 3 users
      return `${typingNames[0]}, ${typingNames[1]} ve ${typingNames.length - 2} kişi daha yazıyor`;
    }
  };

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2">
        {/* Animated dots */}
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
        
        {/* Typing text */}
        <span className="font-medium">
          {getTypingText()}
        </span>
      </div>
    </div>
  );
}

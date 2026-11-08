import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Crown } from 'lucide-react';

const MentionAutocomplete = ({ 
  users = [], 
  position, 
  selectedIndex, 
  onSelect,
  query = '' // Arama query'si (isteğe bağlı, highlight için kullanılabilir)
}) => {
  const listRef = useRef(null);

  // Scroll to selected item
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!users || users.length === 0) return null;

  return (
    <div
      className="absolute z-50 w-72 bg-popover border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        bottom: position?.bottom || 'auto',
        left: position?.left || 0,
        maxHeight: '280px'
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-muted/30 border-b border-border/50 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">
          Kullanıcı Seç
        </p>
        <span className="text-[10px] text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded">
          {users.length} sonuç
        </span>
      </div>

      {/* User List */}
      <div ref={listRef} className="overflow-y-auto max-h-[220px] scrollbar-thin">
        {users.map((user, index) => {
          const isSelected = index === selectedIndex;

          return (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              onMouseEnter={() => {
                // Mouse hover ile de seçili index'i güncelle
                if (window.selectedMentionIndexSetter) {
                  window.selectedMentionIndexSetter(index);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 ${
                isSelected
                  ? 'bg-primary/10 border-l-2 border-primary scale-[1.02]'
                  : 'hover:bg-muted/50 border-l-2 border-transparent hover:scale-[1.01]'
              }`}
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="text-xs font-semibold bg-primary/10">
                  {(user.name || 'G')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  {user.role === 'owner' && (
                    <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium truncate ${
                    isSelected ? 'text-primary' : 'text-foreground'
                  }`}>
                    {user.name}
                  </span>
                </div>
                <code className="text-[9px] text-muted-foreground/70 font-mono">
                  @{user.name.toLowerCase().replace(/\s+/g, '')}
                </code>
              </div>

              {isSelected && (
                <div className="text-xs text-primary font-semibold">
                  ↵
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-muted/20 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground">
          ↑↓ Gezin • ↵ Seç • Esc İptal
        </p>
      </div>
    </div>
  );
};

export default MentionAutocomplete;

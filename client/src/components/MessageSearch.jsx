import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Calendar, User, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Avatar, AvatarFallback } from '@components/ui/avatar';

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Bugün';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Dün';
  } else {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }
};

/**
 * Message Search Modal
 * Features:
 * - Full-text search
 * - Date filtering
 * - User filtering
 * - Keyword highlighting
 * - Jump to message
 */
export default function MessageSearch({ 
  isOpen, 
  onClose, 
  messages = [], 
  users = [],
  currentUserId,
  onJumpToMessage 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, week
  const [showFilters, setShowFilters] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const searchInputRef = useRef(null);
  const resultsContainerRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUser(null);
      setDateFilter('all');
      setCurrentResultIndex(0);
    }
  }, [isOpen]);

  // Filter messages based on search criteria
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.content?.toLowerCase().includes(query) ||
        msg.name?.toLowerCase().includes(query)
      );
    }

    // User filter
    if (selectedUser) {
      filtered = filtered.filter(msg => msg.from === selectedUser);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      filtered = filtered.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        
        switch (dateFilter) {
          case 'today':
            return msgDate >= today;
          case 'yesterday':
            return msgDate >= yesterday && msgDate < today;
          case 'week':
            return msgDate >= weekAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [messages, searchQuery, selectedUser, dateFilter]);

  // Highlight matching text
  const highlightText = (text, query) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-300 dark:bg-yellow-600/40 text-foreground font-semibold rounded px-0.5">{part}</mark>
        : part
    );
  };

  // Navigate results
  const handlePrevious = () => {
    setCurrentResultIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentResultIndex(prev => Math.min(filteredMessages.length - 1, prev + 1));
  };

  // Scroll to current result
  useEffect(() => {
    if (filteredMessages.length > 0 && resultsContainerRef.current) {
      const resultElements = resultsContainerRef.current.querySelectorAll('[data-result-index]');
      const currentElement = resultElements[currentResultIndex];
      currentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentResultIndex, filteredMessages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' && !e.shiftKey) {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'Enter' && filteredMessages.length > 0) {
        e.preventDefault();
        handleJumpToMessage(filteredMessages[currentResultIndex]);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentResultIndex, filteredMessages, onClose]);

  const handleJumpToMessage = (message) => {
    if (onJumpToMessage) {
      onJumpToMessage(message);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl max-h-[70vh] overflow-hidden shadow-2xl border-border/50 bg-card/95 backdrop-blur-md animate-in zoom-in-95 slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-purple-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">Mesaj Ara</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {filteredMessages.length} sonuç bulundu
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Mesajlarda ara... (Enter ile git)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
          >
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Filtreler {(selectedUser || dateFilter !== 'all') && '(Aktif)'}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {/* User Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                  <User className="w-3.5 h-3.5" />
                  Kullanıcı
                </label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={!selectedUser ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                    onClick={() => setSelectedUser(null)}
                  >
                    Hepsi
                  </Badge>
                  {users.map(user => (
                    <Badge
                      key={user.id}
                      variant={selectedUser === user.id ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                      onClick={() => setSelectedUser(user.id === selectedUser ? null : user.id)}
                    >
                      {user.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Tarih
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'Tümü' },
                    { value: 'today', label: 'Bugün' },
                    { value: 'yesterday', label: 'Dün' },
                    { value: 'week', label: 'Son 7 gün' },
                  ].map(option => (
                    <Badge
                      key={option.value}
                      variant={dateFilter === option.value ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                      onClick={() => setDateFilter(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div 
          ref={resultsContainerRef}
          className="overflow-y-auto max-h-[calc(70vh-16rem)] p-4 sm:p-6 space-y-2"
        >
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Sonuç bulunamadı</p>
              <p className="text-xs mt-1">Farklı anahtar kelimeler deneyin</p>
            </div>
          ) : (
            filteredMessages.map((message, index) => {
              const user = users.find(u => u.id === message.from);
              const isCurrent = index === currentResultIndex;

              return (
                <div
                  key={message.id}
                  data-result-index={index}
                  onClick={() => handleJumpToMessage(message)}
                  className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isCurrent 
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md' 
                      : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-primary/10">
                      <AvatarFallback className="text-xs sm:text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                        {(message.name || 'G')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-semibold text-foreground">
                          {message.name || 'Guest'}
                        </span>
                        {message.from === currentUserId && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Sen
                          </Badge>
                        )}
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatDate(message.timestamp)} • {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/90 break-words line-clamp-2">
                        {highlightText(message.content, searchQuery)}
                      </p>
                    </div>

                    {/* Jump indicator */}
                    {isCurrent && (
                      <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-bounce" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer - Navigation */}
        {filteredMessages.length > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentResultIndex === 0}
                  className="text-xs sm:text-sm"
                >
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentResultIndex === filteredMessages.length - 1}
                  className="text-xs sm:text-sm"
                >
                  Sonraki
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                {currentResultIndex + 1} / {filteredMessages.length}
                <span className="ml-2 hidden sm:inline">
                  • <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">↑↓</kbd> gezin
                </span>
                <span className="ml-2 hidden sm:inline">
                  • <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Enter</kbd> git
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

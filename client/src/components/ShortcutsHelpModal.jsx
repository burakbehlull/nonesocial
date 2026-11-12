import { X, Keyboard, Command } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { getShortcutsList } from '@hooks/useKeyboardShortcuts';

/**
 * Shortcuts Help Modal - Quick reference (triggered by ?)
 */
export default function ShortcutsHelpModal({ isOpen, onClose, shortcuts }) {
  if (!isOpen) return null;

  const shortcutsList = getShortcutsList(shortcuts);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl border-border/50 bg-card/95 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-purple-500/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Command className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Klavye Kısayolları</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Hızlı erişim kılavuzu</p>
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

        {/* Shortcuts Grid */}
        <div className="overflow-y-auto max-h-[calc(80vh-10rem)] p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {shortcutsList.map((shortcut, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <Badge 
                  variant="secondary" 
                  className="px-2 sm:px-3 py-1 sm:py-1.5 font-mono text-xs sm:text-sm min-w-[60px] sm:min-w-[80px] text-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors flex-shrink-0"
                >
                  {shortcut.display}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm">{shortcut.label}</div>
                  {shortcut.key === ' ' && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Basılı tut
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2 sm:gap-3">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-xs sm:text-sm mb-1 text-blue-600 dark:text-blue-400">
                  💡 Pro İpucu
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Mesaj yazarken kısayollar otomatik olarak devre dışı kalır. 
                  <kbd className="mx-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Esc</kbd>
                  ile bu pencereyi kapatabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Esc</kbd> ile kapat
            </p>
            <Button 
              onClick={onClose}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Anladım
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { X, Keyboard, Info, Zap } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { getShortcutsList, getShortcutDisplay } from '@hooks/useKeyboardShortcuts';

/**
 * Settings Modal - Keyboard Shortcuts Configuration
 */
export default function SettingsModal({ isOpen, onClose, shortcuts }) {
  const [activeTab, setActiveTab] = useState('shortcuts');

  if (!isOpen) return null;

  const shortcutsList = getShortcutsList(shortcuts);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl border-border/50 bg-card/95 backdrop-blur-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Ayarlar</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Klavye kısayolları ve daha fazlası</p>
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

        {/* Tabs */}
        <div className="flex gap-1 px-4 sm:px-6 pt-3 sm:pt-4 border-b border-border/50">
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`
              px-3 sm:px-4 py-2 rounded-t-lg font-medium transition-colors text-xs sm:text-sm
              ${activeTab === 'shortcuts' 
                ? 'bg-background text-foreground border-t-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Keyboard className="w-3 h-3 sm:w-4 sm:h-4" />
              Klavye Kısayolları
            </div>
          </button>
          {/* Future tabs */}
          <button
            onClick={() => setActiveTab('about')}
            className={`
              px-3 sm:px-4 py-2 rounded-t-lg font-medium transition-colors text-xs sm:text-sm
              ${activeTab === 'about' 
                ? 'bg-background text-foreground border-t-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              Hakkında
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-12rem)] p-4 sm:p-6">
          {activeTab === 'shortcuts' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Info Banner */}
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs sm:text-sm mb-1">Klavye Kısayolları</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Aşağıdaki klavye kısayollarını kullanarak oda kontrollerini hızlıca yönetebilirsiniz.
                    Mesaj yazarken kısayollar devre dışı kalır.
                  </p>
                </div>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-2 sm:space-y-3">
                {shortcutsList.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border/50 hover:border-border transition-colors bg-card/50 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base">{shortcut.label}</div>
                      {shortcut.key === ' ' && (
                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          Basılı tuttuğunuzda geçici olarak susturma kapanır
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="ml-3 px-2 sm:px-3 py-1 sm:py-1.5 font-mono text-xs sm:text-sm whitespace-nowrap group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors"
                    >
                      {shortcut.display}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Custom Shortcuts (Future) */}
              <div className="p-3 sm:p-4 rounded-lg border border-dashed border-border/50 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  🔜 Yakında: Özel klavye kısayolları tanımlayabileceksiniz
                </p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4 sm:space-y-6">
              {/* About Section */}
              <div className="text-center space-y-3 sm:space-y-4 py-6 sm:py-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-3xl font-bold text-white">N</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold gradient-text">None Social</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                    Anonim ve güvenli video chat platformu
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">Version 2.4.0</Badge>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">Beta</Badge>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="text-xs sm:text-sm font-semibold mb-1">🔒 Gizlilik</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    IP şifreleme, otomatik veri silme
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="text-xs sm:text-sm font-semibold mb-1">⚡ Performans</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    WebRTC, gerçek zamanlı iletişim
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="text-xs sm:text-sm font-semibold mb-1">🎨 Modern UI</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Responsive, dark mode, animasyonlar
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg border border-border/50 bg-card/50">
                  <div className="text-xs sm:text-sm font-semibold mb-1">🚀 Özellikler</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Mention, typing indicator, shortcuts
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-border/50">
                <Button variant="outline" className="flex-1 text-xs sm:text-sm" asChild>
                  <a href="/support" target="_blank">
                    Destek & Gizlilik
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 text-xs sm:text-sm" asChild>
                  <a href="/report/new" target="_blank">
                    Rapor Gönder
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Kısayolları görmek için <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">?</kbd> tuşuna basın
            </p>
            <Button 
              onClick={onClose}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Kapat
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

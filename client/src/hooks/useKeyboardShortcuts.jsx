import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard Shortcuts Hook
 * Manages customizable keyboard shortcuts for the room
 * 
 * Default shortcuts:
 * - M: Toggle microphone
 * - V: Toggle video (if available)
 * - S: Toggle screen share
 * - Space: Push-to-talk (hold to unmute)
 * - ?: Show shortcuts modal
 * - Esc: Close modals
 * - Enter: Send message
 * - Ctrl+K: Search (future)
 */

const DEFAULT_SHORTCUTS = {
  toggleMic: 'm',
  toggleVideo: 'v',
  toggleScreenShare: 's',
  pushToTalk: ' ', // Space
  showHelp: '?',
  closeModal: 'Escape',
  sendMessage: 'Enter',
  search: 'k' // Ctrl+K
};

export function useKeyboardShortcuts({
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onShowHelp,
  onCloseModal,
  onSearch,
  disabled = false,
  customShortcuts = {}
}) {
  const shortcuts = { ...DEFAULT_SHORTCUTS, ...customShortcuts };
  const spacePressed = useRef(false);
  const wasAudioEnabled = useRef(false);

  const handleKeyDown = useCallback((e) => {
    if (disabled) return;

    // Skip if user is typing in an input/textarea
    const target = e.target;
    const isTyping = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;

    // Allow Enter in input for sending messages
    if (e.key === shortcuts.sendMessage && isTyping) {
      return; // Let the form handle it
    }

    // Allow Escape always (for closing modals)
    if (e.key === shortcuts.closeModal) {
      e.preventDefault();
      onCloseModal?.();
      return;
    }

    // Skip other shortcuts if typing
    if (isTyping) return;

    const key = e.key.toLowerCase();

    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && key === shortcuts.search) {
      e.preventDefault();
      onSearch?.();
      return;
    }

    // Prevent default for all our shortcuts
    if (Object.values(shortcuts).includes(key) || Object.values(shortcuts).includes(e.key)) {
      e.preventDefault();
    }

    // Toggle Microphone (M)
    if (key === shortcuts.toggleMic) {
      onToggleMic?.();
    }

    // Toggle Video (V)
    if (key === shortcuts.toggleVideo) {
      onToggleVideo?.();
    }

    // Toggle Screen Share (S)
    if (key === shortcuts.toggleScreenShare) {
      onToggleScreenShare?.();
    }

    // Show Help (?)
    if (e.key === shortcuts.showHelp) { // Use e.key for Shift+? detection
      onShowHelp?.();
    }

    // Push-to-Talk: Space (hold to unmute temporarily)
    if (e.key === shortcuts.pushToTalk && !spacePressed.current) {
      spacePressed.current = true;
      // Store current audio state
      // This will be handled by the component
      onToggleMic?.(true); // Force unmute
    }
  }, [
    disabled, 
    shortcuts, 
    onToggleMic, 
    onToggleVideo, 
    onToggleScreenShare, 
    onShowHelp, 
    onCloseModal,
    onSearch
  ]);

  const handleKeyUp = useCallback((e) => {
    if (disabled) return;

    // Push-to-Talk: Release Space (mute again)
    if (e.key === shortcuts.pushToTalk && spacePressed.current) {
      spacePressed.current = false;
      // Restore previous audio state
      onToggleMic?.(false); // Force mute
    }
  }, [disabled, shortcuts, onToggleMic]);

  useEffect(() => {
    if (disabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, disabled]);

  return {
    shortcuts,
    spacePressed: spacePressed.current
  };
}

// Helper function to get shortcut display name
export function getShortcutDisplay(key) {
  const keyMap = {
    ' ': 'Space',
    'Escape': 'Esc',
    'Enter': '↵ Enter',
    'k': 'Ctrl+K'
  };

  return keyMap[key] || key.toUpperCase();
}

// Get all shortcuts as array for display
export function getShortcutsList(shortcuts = DEFAULT_SHORTCUTS) {
  return [
    { key: shortcuts.toggleMic, label: 'Mikrofon Aç/Kapat', display: getShortcutDisplay(shortcuts.toggleMic) },
    { key: shortcuts.toggleVideo, label: 'Video Aç/Kapat', display: getShortcutDisplay(shortcuts.toggleVideo) },
    { key: shortcuts.toggleScreenShare, label: 'Ekran Paylaşımı', display: getShortcutDisplay(shortcuts.toggleScreenShare) },
    { key: shortcuts.pushToTalk, label: 'Geçici Sustur', display: 'Space (Basılı Tut)' },
    { key: shortcuts.showHelp, label: 'Kısayol Listesi', display: getShortcutDisplay(shortcuts.showHelp) },
    { key: shortcuts.closeModal, label: 'Modal Kapat', display: getShortcutDisplay(shortcuts.closeModal) },
    { key: shortcuts.sendMessage, label: 'Mesaj Gönder', display: getShortcutDisplay(shortcuts.sendMessage) },
    { key: shortcuts.search, label: 'Arama', display: getShortcutDisplay(shortcuts.search) }
  ];
}

export { DEFAULT_SHORTCUTS };

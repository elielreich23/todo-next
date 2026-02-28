'use client';

import { useEffect, useCallback } from 'react';

export const SHORTCUT_KEYS = {
  COMMAND_PALETTE: 'k',
  HELP: '?',
  ESCAPE: 'Escape',
} as const;

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
export const modKey = isMac ? '⌘' : 'Ctrl';

export type ShortcutHandlers = {
  onOpenCommandPalette?: () => void;
  onOpenHelp?: () => void;
  onClose?: () => void;
};

/**
 * Global keyboard shortcuts for dashboard (Cmd/Ctrl+K palette, ? help, Escape close).
 * Only active when handlers are provided and no input/textarea is focused.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { onOpenCommandPalette, onOpenHelp, onClose } = handlers;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
      if (isInput) return;

      if (e.key === SHORTCUT_KEYS.ESCAPE) {
        onClose?.();
        return;
      }

      if (e.key === SHORTCUT_KEYS.HELP && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenHelp?.();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === SHORTCUT_KEYS.COMMAND_PALETTE) {
        e.preventDefault();
        onOpenCommandPalette?.();
      }
    },
    [onOpenCommandPalette, onOpenHelp, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

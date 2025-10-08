// hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

export type Shortcut = {
  keys: string[];
  action: () => void;
  description: string;
  global?: boolean; // If true, shortcut works even when typing in inputs
};

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Check if user is currently typing in an input field
      const isInputActive =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        (target?.getAttribute &&
          target.getAttribute('contenteditable') === 'true');

      // allow typing but still allow global combos — remove early return
      const matching = shortcuts.find(s =>
        s.keys.every(key => {
          const k = key.toLowerCase();
          if (k === 'ctrl') return event.ctrlKey;
          if (k === 'shift') return event.shiftKey;
          if (k === 'alt') return event.altKey;
          if (k === 'meta') return event.metaKey; // macOS Cmd
          return event.key.toLowerCase() === k;
        })
      );

      if (matching) {
        // If it's a global shortcut or user is not typing in an input
        if (matching.global || !isInputActive) {
          // block browser defaults (Ctrl+D bookmarks etc.)
          event.preventDefault();
          matching.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

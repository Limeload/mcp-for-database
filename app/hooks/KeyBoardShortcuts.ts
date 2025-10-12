// hooks/useKeyboardShortcuts.ts
import { useEffect } from "react";

export type Shortcut = {
  keys: string[];
  action: () => void;
  description: string;
};

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      (target?.getAttribute && target.getAttribute("contenteditable") === "true");

      // If user is typing in an input-like element without modifiers, do nothing
      if (isTyping && !(event.ctrlKey || event.metaKey || event.altKey)) {
        return;
      }

      // allow typing but still allow global combos — remove early return
      const matching = shortcuts.find((s) =>
      s.keys.every((key) => {
        const k = key.toLowerCase();
        if (k === "ctrl") return event.ctrlKey;
        if (k === "shift") return event.shiftKey;
        if (k === "alt") return event.altKey;
        if (k === "meta") return event.metaKey; // macOS Cmd
        return event.key.toLowerCase() === k;
      })
      );

      if (matching) {
      // block browser defaults (Ctrl+D bookmarks etc.)
      event.preventDefault();
      matching.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

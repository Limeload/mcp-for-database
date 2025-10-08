// config/shortcuts.ts
import { Shortcut } from "../hooks/KeyBoardShortcuts";

export type ShortcutHandlers = {
  executeQuery: () => void;
  clearForm: () => void;
  focusInput: () => void;
  toggleDarkMode: () => void;
  exportResults: () => void;
};

/**
 * Create runtime shortcuts by providing actual handlers from the component.
 */
export const createShortcuts = (h: ShortcutHandlers): Shortcut[] => [
  { keys: ["Ctrl", "Enter"], action: h.executeQuery, description: "Execute query" },
  { keys: ["Ctrl", "K"], action: h.clearForm, description: "Clear form" },
  { keys: ["Ctrl", "L"], action: h.focusInput, description: "Focus query input" },
  { keys: ["Ctrl", "D"], action: h.toggleDarkMode, description: "Toggle dark mode" },
  { keys: ["Ctrl", "E"], action: h.exportResults, description: "Export results" },
];

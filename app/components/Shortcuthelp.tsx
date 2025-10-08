// components/ShortcutHelp.tsx
"use client";

import React, { useState } from "react";
import { Shortcut } from "../hooks/KeyBoardShortcuts";

interface ShortcutHelpProps {
  shortcuts?: Shortcut[];
  className?: string;
}

export default function ShortcutHelp({ shortcuts = [], className = "" }: ShortcutHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(true)}
        className=" text-white font-medium shadow-xl-modern transition-all-modern hover:opacity-90"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Show Shortcuts
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl-modern-dark w-96 max-w-full animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard Shortcuts"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>

            <ul className="space-y-3">
              {shortcuts.map((s, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded transition-all-modern"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">{s.description}</span>
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">
                    {s.keys.join(" + ")}
                  </code>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full px-3 py-2 rounded bg-gradient-modern-2 text-white font-medium shadow-xl-modern transition-all-modern hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

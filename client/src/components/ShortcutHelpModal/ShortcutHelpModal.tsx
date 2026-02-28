'use client';

import React, { useEffect, useRef } from 'react';
import { modKey } from '../../hooks/useKeyboardShortcuts';
import styles from './ShortcutHelpModal.module.scss';

interface ShortcutRow {
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: [modKey, 'K'], description: 'Open command palette' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['↑', '↓'], description: 'Navigate list in palette' },
  { keys: ['Enter'], description: 'Select highlighted item' },
  { keys: ['Esc'], description: 'Close palette or this dialog' },
];

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutHelpModal({ isOpen, onClose }: ShortcutHelpModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Keyboard shortcuts</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <ul className={styles.list}>
          {SHORTCUTS.map((row, i) => (
            <li key={i} className={styles.row}>
              <span className={styles.keys}>
                {row.keys.map((k) => (
                  <kbd key={k} className={styles.kbd}>{k}</kbd>
                ))}
              </span>
              <span className={styles.desc}>{row.description}</span>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>Press Esc to close</p>
      </div>
    </div>
  );
}

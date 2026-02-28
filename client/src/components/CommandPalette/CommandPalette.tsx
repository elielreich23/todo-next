'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CommandPalette.module.scss';

export type CommandItem = {
  id: string;
  label: string;
  subtitle?: string;
  href?: string;
  action?: () => void;
  keywords?: string[];
};

const DEFAULT_ITEMS: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', keywords: ['home', 'main'] },
  { id: 'profile', label: 'Profile', href: '/dashboard/profile', keywords: ['user', 'account'] },
  { id: 'calendar', label: 'Calendar', href: '/dashboard/calendar', keywords: ['schedule', 'dates'] },
  { id: 'statistics', label: 'Statistics', href: '/dashboard/statistics', keywords: ['stats', 'analytics'] },
  { id: 'uploads', label: 'Uploads', href: '/dashboard/uploads', keywords: ['files', 'upload'] },
  { id: 'settings', label: 'Settings', href: '/dashboard/settings', keywords: ['preferences', 'config'] },
  { id: 'notifications', label: 'Notifications', href: '/dashboard/notifications', keywords: ['alerts', 'bell'] },
  { id: 'new-task', label: 'New task', subtitle: 'Create a new task', keywords: ['add', 'create'] },
];

function matchItem(item: CommandItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.subtitle?.toLowerCase().includes(q)) return true;
  if (item.keywords?.some((k) => k.includes(q))) return true;
  return false;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CommandItem[];
}

export default function CommandPalette({ isOpen, onClose, items = DEFAULT_ITEMS }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => items.filter((i) => matchItem(i, query)), [items, query]);
  const selectedId = filtered[selectedIndex]?.id;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (selectedIndex < 0) setSelectedIndex(Math.max(0, filtered.length - 1));
    else if (selectedIndex >= filtered.length) setSelectedIndex(0);
  }, [selectedIndex, filtered.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !selectedId) return;
    const option = el.querySelector(`[data-id="${selectedId}"]`);
    option?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const handleSelect = (item: CommandItem) => {
    if (item.action) {
      item.action();
      onClose();
      return;
    }
    if (item.id === 'new-task') {
      router.push('/dashboard?openCreate=1');
      onClose();
      return;
    }
    if (item.href) {
      router.push(item.href);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => i + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => i - 1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) handleSelect(item);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={onClose}
    >
      <div
        className={styles.palette}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <span className={styles.icon} aria-hidden>⌘</span>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Search or jump to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search commands"
            autoComplete="off"
          />
        </div>
        <ul ref={listRef} className={styles.list} role="listbox">
          {filtered.length === 0 ? (
            <li className={`${styles.item} ${styles.empty}`}>No results</li>
          ) : (
            filtered.map((item, i) => (
              <li
                key={item.id}
                data-id={item.id}
                role="option"
                aria-selected={selectedIndex === i}
                className={`${styles.item} ${selectedIndex === i ? styles.selected : ''}`.trim()}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className={styles.itemLabel}>{item.label}</span>
                {item.subtitle && (
                  <span className={styles.itemSubtitle}>{item.subtitle}</span>
                )}
              </li>
            ))
          )}
        </ul>
        <div className={styles.footer}>
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

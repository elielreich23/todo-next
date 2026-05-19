"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '../../contexts/UserContext';
import DashboardShell from './dashboard';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import PageTransition from '../../components/PageTransition/PageTransition';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import CommandPalette from '../../components/CommandPalette/CommandPalette';
import ShortcutHelpModal from '../../components/ShortcutHelpModal/ShortcutHelpModal';
import { getAccessToken } from '../../utils/storage';

const NotificationBell = dynamic(
  () => import('../../components/NotificationBell/NotificationBell').then((mod) => ({ default: mod.default })),
  { ssr: false, loading: () => <div className="dashboard-toolbar-placeholder" aria-hidden /> }
);

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);

  const closeOverlays = useCallback(() => {
    setCommandPaletteOpen(false);
    setShortcutHelpOpen(false);
  }, []);

  useKeyboardShortcuts({
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onOpenHelp: () => setShortcutHelpOpen(true),
    onClose: closeOverlays,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  const mayHaveSession = isAuthenticated || (typeof window !== 'undefined' && !!getAccessToken());

  if (isLoading && !mayHaveSession) {
    return (
      <div className="dashboard-auth-loading">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isLoading && !isAuthenticated) {
    return null;
  }

  return (
    <>
      <DashboardShell>
        <div className="dashboard-layout-inner">
          <div className="dashboard-layout-toolbar">
            <Suspense fallback={<div className="dashboard-toolbar-placeholder" aria-hidden />}>
              <NotificationBell />
            </Suspense>
          </div>
          <main id="main-content" tabIndex={-1}>
            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <PageTransition>{children}</PageTransition>
            )}
          </main>
        </div>
      </DashboardShell>
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <ShortcutHelpModal isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
    </>
  );
}

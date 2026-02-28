"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '../../contexts/UserContext';
import SideBarMod from '../../components/sideBar/sideBar';
const SideBar = typeof SideBarMod === 'function' ? SideBarMod : (SideBarMod?.default ?? SideBarMod);
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import PageTransitionMod from '../../components/PageTransition/PageTransition';
const PageTransition = typeof PageTransitionMod === 'function' ? PageTransitionMod : (PageTransitionMod?.default ?? PageTransitionMod);
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
// Use .default when present so layout works with both direct and barrel resolution
import CommandPaletteMod from '../../components/CommandPalette/CommandPalette';
import ShortcutHelpModalMod from '../../components/ShortcutHelpModal/ShortcutHelpModal';
const CommandPalette = typeof CommandPaletteMod === 'function' ? CommandPaletteMod : (CommandPaletteMod?.default ?? CommandPaletteMod);
const ShortcutHelpModal = typeof ShortcutHelpModalMod === 'function' ? ShortcutHelpModalMod : (ShortcutHelpModalMod?.default ?? ShortcutHelpModalMod);

// Lazy load heavy components (explicit default for reliable resolution)
const NotificationBell = dynamic(
  () => import('../../components/NotificationBell/NotificationBell').then((mod) => ({ default: mod.default })),
  { ssr: false, loading: () => <div style={{ width: '40px', height: '40px' }} /> }
);

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, validateSession } = useUser();
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
    // Validate session on mount
    validateSession();

    // Redirect if not authenticated after loading
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      }
    }
  }, [isAuthenticated, isLoading, validateSession, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <DashboardSkeleton />
      </div>
    );
  }

  // If not authenticated after loading, show nothing (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      {typeof SideBar === 'function' && <SideBar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <Suspense fallback={<div style={{ width: '40px', height: '40px' }} />}>
            <NotificationBell />
          </Suspense>
        </header>
        <main id="main-content" style={{ flex: 1, padding: '2rem' }} tabIndex={-1}>
          <Suspense fallback={<DashboardSkeleton />}>
            <PageTransition>
              {children}
            </PageTransition>
          </Suspense>
        </main>
      </div>
      {typeof CommandPalette === 'function' && <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />}
      {typeof ShortcutHelpModal === 'function' && <ShortcutHelpModal isOpen={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />}
    </div>
  );
}

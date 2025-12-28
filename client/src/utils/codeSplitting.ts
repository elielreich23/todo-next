/**
 * Code Splitting Utilities
 * Provides helpers for lazy loading components and routes
 */

import React, { ComponentType, lazy, Suspense, ReactNode } from 'react';
import { DashboardSkeleton, ProjectListSkeleton, TaskCardSkeleton } from '../components/SkeletonLoader';

/**
 * Create a lazy-loaded component with skeleton fallback
 */
export function createLazyComponentWithSkeleton<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  skeleton?: ReactNode
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFunc);

  const LazyWrapper = (props: React.ComponentProps<T>) => {
    return React.createElement(
      Suspense,
      { fallback: skeleton || React.createElement(DashboardSkeleton) },
      React.createElement(LazyComponent, props)
    );
  };

  LazyWrapper.displayName = 'LazyWrapper';
  return LazyWrapper;
}

/**
 * Lazy load dashboard routes
 */
export const LazyDashboard = lazy(() => import('../app/dashboard/page'));
export const LazyCalendar = lazy(() => import('../app/dashboard/calendar/page'));
export const LazyNotifications = lazy(() => import('../app/dashboard/notifications/page'));
export const LazyProfile = lazy(() => import('../app/dashboard/profile/page'));
export const LazySettings = lazy(() => import('../app/dashboard/settings/page'));
export const LazyStatistics = lazy(() => import('../app/dashboard/statistics/page'));

/**
 * Lazy load heavy components
 */
export const LazyProjectWizard = lazy(() =>
  import('../components/ProjectWizard/ProjectWizard').then(mod => ({ default: mod.default }))
);

export const LazySessionManagement = lazy(() =>
  import('../components/SessionManagement/SessionManagement').then(mod => ({ default: mod.default }))
);

/**
 * Preload a component (useful for hover/click events)
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  importFunc();
}

/**
 * Route-based code splitting helper
 */
export function withRouteSplitting<P extends object>(
  Component: ComponentType<P>,
  loadingComponent?: ReactNode
) {
  return function RouteWrapper(props: P) {
    return React.createElement(
      Suspense,
      { fallback: loadingComponent || React.createElement(DashboardSkeleton) },
      React.createElement(Component, props)
    );
  };
}

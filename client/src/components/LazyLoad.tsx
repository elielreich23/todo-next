/**
 * Higher-order component for lazy loading components
 */
'use client';

import React, { ComponentType, Suspense, lazy, ReactNode, useState, useEffect, useRef } from 'react';

interface LazyLoadOptions {
  fallback?: ReactNode;
  preload?: boolean;
}

/**
 * Create a lazy-loaded component with Suspense wrapper
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(importFunc);
  const { fallback = <div>Loading...</div> } = options;

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load wrapper with intersection observer
 */
export function withLazyLoad<P extends object>(
  Component: ComponentType<P>,
  options: LazyLoadOptions = {}
) {
  const { fallback = <div>Loading...</div> } = options;

  return function LazyLoadWrapper(props: P) {
    const [shouldLoad, setShouldLoad] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (shouldLoad) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '100px',
          threshold: 0.01,
        }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [shouldLoad]);

    if (!shouldLoad) {
      return (
        <div ref={ref} style={{ minHeight: '200px' }}>
          {fallback}
        </div>
      );
    }

    return <Component {...props} />;
  };
}

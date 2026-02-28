import { useState, useEffect, useRef, RefObject } from 'react';

// -------------------- CONSTANTS --------------------

const DEFAULT_ROOT_MARGIN = '50px';
const DEFAULT_THRESHOLD = 0.01;

// -------------------- TYPES --------------------

interface UseIntersectionObserverOptions {
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
}

// -------------------- HOOK --------------------

/**
 * Custom hook for intersection observer
 * Tracks when an element enters the viewport
 */
export function useIntersectionObserver({
  rootMargin = DEFAULT_ROOT_MARGIN,
  threshold = DEFAULT_THRESHOLD,
  enabled = true,
}: UseIntersectionObserverOptions = {}): [RefObject<HTMLDivElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || isIntersecting) {
      return;
    }

    const element = elementRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, isIntersecting, rootMargin, threshold]);

  return [elementRef, isIntersecting];
}

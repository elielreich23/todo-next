/**
 * Smooth scrolling utilities
 */

export function smoothScrollTo(element: HTMLElement | string, options?: ScrollIntoViewOptions) {
  const target = typeof element === 'string' ? document.querySelector(element) : element;

  if (target && target instanceof HTMLElement) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
      ...options,
    });
  }
}

export function smoothScrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

export function smoothScrollToBottom(element?: HTMLElement) {
  const target = element || document.documentElement;
  target.scrollTo({
    top: target.scrollHeight,
    behavior: 'smooth',
  });
}

/**
 * Add smooth scrolling to the document
 */
export function enableSmoothScrolling() {
  if (typeof document !== 'undefined') {
    document.documentElement.style.scrollBehavior = 'smooth';
  }
}

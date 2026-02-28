/**
 * Image Optimization Utilities
 * Provides helpers for WebP conversion and image optimization
 */

/**
 * Note: Next.js Image component handles optimization automatically.
 * This utility is kept for potential future custom optimization needs.
 *
 * @deprecated Use Next.js Image component directly for optimization
 */
export function getOptimizedImageUrl(src: string): string {
  return src;
}

// -------------------- CONSTANTS --------------------

const DEFAULT_BLUR_WIDTH = 10;
const DEFAULT_BLUR_HEIGHT = 10;
const PLACEHOLDER_COLOR = '#f0f0f0';
const FALLBACK_BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+';

/**
 * Generates a blur placeholder data URL for images
 */
export function generateBlurDataURL(
  width: number = DEFAULT_BLUR_WIDTH,
  height: number = DEFAULT_BLUR_HEIGHT
): string {
  if (typeof document === 'undefined') {
    return FALLBACK_BLUR_DATA_URL;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return FALLBACK_BLUR_DATA_URL;
  }

  ctx.fillStyle = PLACEHOLDER_COLOR;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}

/**
 * Check if WebP is supported
 */
export function isWebPSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

// -------------------- TYPES --------------------

interface ResponsiveBreakpoints {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  large?: string;
}

// -------------------- CONSTANTS --------------------

const DEFAULT_BREAKPOINTS = {
  mobile: '100vw',
  tablet: '768px',
  desktop: '1024px',
  large: '1920px',
} as const;

const BREAKPOINT_VALUES = {
  tablet: 768,
  desktop: 1024,
  large: 1920,
} as const;

/**
 * Generates responsive image sizes string for Next.js Image component
 */
export function getResponsiveSizes(breakpoints: ResponsiveBreakpoints = {}): string {
  const {
    mobile = DEFAULT_BREAKPOINTS.mobile,
    tablet = DEFAULT_BREAKPOINTS.tablet,
    desktop = DEFAULT_BREAKPOINTS.desktop,
    large = DEFAULT_BREAKPOINTS.large,
  } = breakpoints;

  return `(max-width: ${BREAKPOINT_VALUES.tablet}px) ${mobile}, (max-width: ${BREAKPOINT_VALUES.desktop}px) ${tablet}, (max-width: ${BREAKPOINT_VALUES.large}px) ${desktop}, ${large}`;
}

/**
 * Image optimization configuration for Next.js
 */
export const IMAGE_CONFIG = {
  // Formats to use (Next.js will serve WebP when supported)
  formats: ['image/avif', 'image/webp'] as const,

  // Device sizes for responsive images
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

  // Image sizes for different breakpoints
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

  // Minimum cache TTL (in seconds)
  minimumCacheTTL: 60,

  // Quality (0-100)
  quality: 80,
};

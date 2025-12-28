/**
 * Image Optimization Utilities
 * Provides helpers for WebP conversion and image optimization
 */

/**
 * Generate optimized image URL with WebP format
 * Falls back to original format if WebP is not supported
 */
export function getOptimizedImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  // If using Next.js Image component, it handles WebP automatically
  // This is for external images or custom optimization
  if (src.startsWith('http') || src.startsWith('//')) {
    // For external images, return as-is (Next.js Image will optimize)
    return src;
  }

  // For local images, Next.js Image component handles optimization
  return src;
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+';
  }

  // Create a simple gray placeholder
  ctx.fillStyle = '#f0f0f0';
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

/**
 * Get responsive image sizes for Next.js Image component
 */
export function getResponsiveSizes(breakpoints: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  large?: string;
}): string {
  const { mobile = '100vw', tablet = '768px', desktop = '1024px', large = '1920px' } = breakpoints;

  return `(max-width: 768px) ${mobile}, (max-width: 1024px) ${tablet}, (max-width: 1920px) ${desktop}, ${large}`;
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

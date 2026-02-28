/**
 * Lazy-loaded image component with Next.js Image optimization
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// -------------------- CONSTANTS --------------------

const PLACEHOLDER_BG_COLOR = '#f0f0f0';
const PLACEHOLDER_TEXT_COLOR = '#999';

// -------------------- TYPES --------------------

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// -------------------- COMPONENT --------------------

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  objectFit = 'cover',
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgRef, isInView] = useIntersectionObserver({
    enabled: !priority,
  });

  const shouldLoad = priority || isInView;

  /**
   * Handles image load event
   */
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  /**
   * Handles image error event
   */
  const handleError = () => {
    onError?.();
  };

  const containerStyle: React.CSSProperties = {
    position: fill ? 'relative' : 'static',
    width: fill ? '100%' : width,
    height: fill ? '100%' : height,
    backgroundColor: isLoaded ? 'transparent' : PLACEHOLDER_BG_COLOR,
    transition: 'background-color 0.3s ease',
  };

  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: PLACEHOLDER_BG_COLOR,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: PLACEHOLDER_TEXT_COLOR,
    fontSize: '14px',
  };

  return (
    <div ref={imgRef} className={className} style={containerStyle}>
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes}
          className={className}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          style={{ objectFit }}
        />
      ) : (
        <div style={placeholderStyle} aria-label="Loading image...">
          Loading...
        </div>
      )}
    </div>
  );
}

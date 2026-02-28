'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#6366f1',
    color: 'white',
  },
  secondary: {
    backgroundColor: '#e5e7eb',
    color: '#1f2937',
  },
  danger: {
    backgroundColor: '#ef4444',
    color: 'white',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#6366f1',
  },
};

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, variant = 'primary', size = 'medium', loading = false, className = '', ...props }, ref) => {
    const baseStyles: React.CSSProperties = {
      padding: size === 'small' ? '0.5rem 1rem' : size === 'large' ? '1rem 2rem' : '0.75rem 1.5rem',
      fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
      fontWeight: 500,
      borderRadius: '0.5rem',
      border: 'none',
      cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    };

    // Ensure variant is always a valid ButtonVariant
    const currentVariant: ButtonVariant = variant || 'primary';

    return (
      <motion.button
        ref={ref}
        className={className}
        style={{
          ...baseStyles,
          ...variantStyles[currentVariant],
          opacity: loading || props.disabled ? 0.6 : 1,
        }}
        whileHover={
          !loading && !props.disabled
            ? {
                scale: 1.02,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }
            : {}
        }
        whileTap={
          !loading && !props.disabled
            ? {
                scale: 0.98,
              }
            : {}
        }
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        {...props}
      >
        {loading && (
          <motion.span
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;

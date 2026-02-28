'use client';

import { motion } from 'framer-motion';
import { ReactNode, Children } from 'react';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: (type: string) => {
    switch (type) {
      case 'slide':
        return { opacity: 0, x: -20 };
      case 'scale':
        return { opacity: 0, scale: 0.8 };
      default:
        return { opacity: 0 };
    }
  },
  visible: (type: string) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export default function AnimatedList({
  children,
  className = '',
  staggerDelay = 0.05,
  animationType = 'fade',
}: AnimatedListProps) {
  const customContainerVariants = {
    ...containerVariants,
    visible: {
      ...containerVariants.visible,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  // Convert children to array for proper mapping
  const childrenArray = Children.toArray(children);

  return (
    <motion.div
      variants={customContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          custom={animationType}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

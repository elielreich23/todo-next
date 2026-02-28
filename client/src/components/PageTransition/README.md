# Micro-interactions & Animations

This directory contains components and utilities for adding smooth animations and micro-interactions throughout the application.

## Components

### PageTransition

Smooth page transitions for route changes. Wraps page content to add fade and slide animations.

```tsx
import PageTransition from '@/components/PageTransition/PageTransition';

export default function MyPage() {
  return (
    <PageTransition>
      <div>Page content</div>
    </PageTransition>
  );
}
```

### AnimatedList

Adds staggered animations to list items. Automatically animates children as they mount.

```tsx
import AnimatedList from '@/components/AnimatedList/AnimatedList';

<AnimatedList animationType="slide" staggerDelay={0.05}>
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</AnimatedList>
```

### AnimatedButton

Button component with hover and tap animations.

```tsx
import AnimatedButton from '@/components/AnimatedButton/AnimatedButton';

<AnimatedButton
  variant="primary"
  size="medium"
  loading={isLoading}
  onClick={handleClick}
>
  Click Me
</AnimatedButton>
```

## Utilities

### smoothScroll

Utility functions for smooth scrolling:

```tsx
import { smoothScrollTo, smoothScrollToTop, smoothScrollToBottom } from '@/utils/smoothScroll';

// Scroll to element
smoothScrollTo('#section-id');

// Scroll to top
smoothScrollToTop();

// Scroll to bottom
smoothScrollToBottom();
```

## Styles

Global animation styles are available in `styles/animations.scss`:

- `.animate-pulse` - Pulsing animation
- `.animate-spin` - Spinning animation
- `.animate-fade-in` - Fade in animation
- `.animate-slide-up` - Slide up animation
- `.hover-lift` - Lift effect on hover
- `.hover-scale` - Scale effect on hover

## Features Implemented

✅ Page transitions
✅ Loading animations (enhanced skeleton loaders)
✅ Hover effects and button feedback
✅ Smooth scrolling
✅ List animations with stagger effect

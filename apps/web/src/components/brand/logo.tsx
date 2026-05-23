import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

export function PawMark({ className, animated = true }: { className?: string; animated?: boolean }) {
  const Comp = animated ? motion.svg : 'svg';
  const animateProps = animated
    ? {
        animate: { rotate: [0, -4, 4, 0] },
        transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' as const },
      }
    : {};
  return (
    <Comp
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-7 w-7', className)}
      aria-hidden
      {...animateProps}
    >
      <defs>
        <linearGradient id="pawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--hero-glow-a))" />
          <stop offset="55%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--hero-glow-b))" />
        </linearGradient>
      </defs>
      {/* Main pad */}
      <path
        fill="url(#pawGrad)"
        d="M32 56c-7 0-13-5-13-11 0-7 6-11 13-11s13 4 13 11c0 6-6 11-13 11Z"
      />
      {/* Toe pads */}
      <ellipse cx="14" cy="32" rx="5.5" ry="7" fill="url(#pawGrad)" />
      <ellipse cx="50" cy="32" rx="5.5" ry="7" fill="url(#pawGrad)" />
      <ellipse cx="23" cy="18" rx="5"   ry="6.5" fill="url(#pawGrad)" />
      <ellipse cx="41" cy="18" rx="5"   ry="6.5" fill="url(#pawGrad)" />
    </Comp>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-[17px] font-black leading-none tracking-tight', className)}>
      <span className="text-gradient-brand">Paw</span>
      <span className="text-foreground">Cook</span>
    </span>
  );
}

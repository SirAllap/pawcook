import type { SVGProps } from 'react';
import { cn } from '../../lib/cn';

// Minimalist dog silhouette icon.
export function DogIcon({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('h-5 w-5', className)}
      {...rest}
    >
      {/* Head outline */}
      <path d="M4 11c0-3 2-6 5-6 1.6 0 2.4.8 3 1.5.6-.7 1.4-1.5 3-1.5 3 0 5 3 5 6 0 0 1 1.5 0 3-.7 1-2 1-2 1v3a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-3s-1.3 0-2-1c-1-1.5 0-3 0-3z" />
      {/* Ears */}
      <path d="M6 7l-2-2v3M18 7l2-2v3" />
      {/* Eyes */}
      <circle cx="9.5" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      {/* Nose */}
      <path d="M12 14.5l-.8 1h1.6L12 14.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Minimalist cat silhouette icon.
export function CatIcon({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('h-5 w-5', className)}
      {...rest}
    >
      {/* Pointy ears + head */}
      <path d="M4 9l2-5 3 3h6l3-3 2 5v6a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V9z" />
      {/* Eyes — almond shaped */}
      <path d="M9 12c.4-.6 1.2-.6 1.6 0M13.4 12c.4-.6 1.2-.6 1.6 0" />
      {/* Nose */}
      <path d="M12 14.5l-.6 1h1.2L12 14.5z" fill="currentColor" stroke="none" />
      {/* Whiskers */}
      <path d="M8 15.5l-2 .5M16 15.5l2 .5M8 16.5l-2 1M16 16.5l2 1" />
    </svg>
  );
}

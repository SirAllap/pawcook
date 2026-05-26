import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { fadeUp, fade, scaleIn } from '../../lib/motion';

type Preset = 'up' | 'fade' | 'scale';

const variants = { up: fadeUp, fade, scale: scaleIn };

export function FadeIn({
  children,
  delay = 0,
  preset = 'up',
  once = true,
  amount = 0.25,
  eager = false,
  className,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  preset?: Preset;
  once?: boolean;
  amount?: number;
  /**
   * Animate on mount instead of waiting for the element to scroll into view.
   * Use this when FadeIn lives inside a parent that is itself animating
   * (e.g. PageTransition's AnimatePresence) — the whileInView observer
   * races with the parent transform and can leave the element stuck at
   * opacity 0. Scroll-reveal still defaults on for landing-style use.
   */
  eager?: boolean;
  className?: string;
} & HTMLMotionProps<'div'>) {
  const motionProps = eager
    ? { initial: 'hidden' as const, animate: 'show' as const }
    : {
        initial: 'hidden' as const,
        whileInView: 'show' as const,
        viewport: { once, amount },
      };

  return (
    <motion.div
      {...motionProps}
      variants={variants[preset]}
      transition={{ delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

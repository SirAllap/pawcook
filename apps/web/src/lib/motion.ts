import type { Variants, Transition } from 'motion/react';

export const easeOut: Transition['ease'] = [0.32, 0.72, 0, 1];
export const easeSpring: Transition['ease'] = [0.34, 1.56, 0.64, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.4, ease: easeOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.32, ease: easeSpring } },
};

export const staggerContainer = (delay = 0.05, stagger = 0.07): Variants => ({
  hidden: {},
  show: {
    transition: { delayChildren: delay, staggerChildren: stagger },
  },
});

export const transitionBase: Transition = { duration: 0.4, ease: easeOut };

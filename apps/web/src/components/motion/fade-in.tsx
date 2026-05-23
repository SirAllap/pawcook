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
  className,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  preset?: Preset;
  once?: boolean;
  amount?: number;
  className?: string;
} & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={variants[preset]}
      transition={{ delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

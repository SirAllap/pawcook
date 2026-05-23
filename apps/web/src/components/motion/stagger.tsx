import { Children, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { fadeUp, staggerContainer } from '../../lib/motion';

export function Stagger({
  children,
  delay = 0,
  stagger = 0.06,
  once = true,
  amount = 0.2,
  className,
}: {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  once?: boolean;
  amount?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={staggerContainer(delay, stagger)}
      className={className}
    >
      {Children.map(children, (child, i) => (
        <motion.div key={i} variants={fadeUp}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

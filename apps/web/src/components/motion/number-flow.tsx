import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

export function NumberFlow({
  value,
  format = (v) => Math.round(v).toLocaleString(),
  className,
}: {
  value: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 80, damping: 20, mass: 1 });
  const [display, setDisplay] = useState(() => format(value));

  // Animate from 0 → value the first time the element enters view.
  // For reduced-motion users (or if inView never fires), the value is
  // already correct from initial state.
  useEffect(() => {
    if (reduced) return;
    if (!inView) return;
    mv.set(0);
    requestAnimationFrame(() => mv.set(value));
  }, [inView, value, mv, reduced]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(format(v)));
    return unsub;
  }, [spring, format]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

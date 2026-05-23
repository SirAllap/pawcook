import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';

export function NumberFlow({
  value,
  duration = 1.2,
  format = (v) => Math.round(v).toLocaleString(),
  className,
}: {
  value: number;
  duration?: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 20, mass: 1 });
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(format(v)));
    return unsub;
  }, [spring, format]);

  // duration not directly used by spring; kept for API symmetry
  void duration;

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

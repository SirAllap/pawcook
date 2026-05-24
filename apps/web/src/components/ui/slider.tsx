import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '../../lib/cn';

export interface SliderProps extends ComponentPropsWithoutRef<typeof RadixSlider.Root> {
  // Optional "recommended range" guide rail. Renders a shaded band on the
  // track at the given percentages (0–100) so users see at a glance whether
  // they're inside the nutritional safe zone without being blocked.
  recommended?: { min: number; max: number };
}

export const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider(
  { className, recommended, ...rest },
  ref,
) {
  const min = rest.min ?? 0;
  const max = rest.max ?? 100;
  const span = Math.max(1, max - min);

  return (
    <RadixSlider.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center py-2', className)}
      {...rest}
    >
      <RadixSlider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-surface-2">
        {recommended && (
          <span
            aria-hidden
            className="absolute inset-y-0 bg-success/25"
            style={{
              left: `${((recommended.min - min) / span) * 100}%`,
              width: `${((recommended.max - recommended.min) / span) * 100}%`,
            }}
          />
        )}
        <RadixSlider.Range className="absolute h-full rounded-full bg-primary/70" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-surface shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary/60" />
    </RadixSlider.Root>
  );
});

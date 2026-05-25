import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Eyebrow } from './eyebrow';

/**
 * Section-level header used inside cards, tabs, or page sub-regions.
 * The landing's `Hero`, `HouseholdToBag`, `ProductPreview`, `HowItWorks`,
 * `DietsShowcase`, `BentoGrid`, and `MantraCard` all assemble the same
 * three-part block (eyebrow → headline → sub) by hand — this centralises
 * the typography so the rest of the app inherits the landing voice
 * without copy-pasting class strings around.
 *
 * For top-of-page hero areas use `PageHeader` instead (it includes its
 * own entrance animation and a `glow` prop). This one stays still and
 * lets the surrounding `FadeIn` animate the whole region.
 */
export function SectionHeader({
  eyebrow,
  title,
  sub,
  align = 'left',
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  align?: 'left' | 'center';
  actions?: ReactNode;
  className?: string;
}) {
  const isCentred = align === 'center';
  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3',
        isCentred && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn(isCentred && 'max-w-2xl mx-auto')}>
        {eyebrow && <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-balance text-foreground">
          {title}
        </h2>
        {sub && (
          <p className="mt-2 text-sm text-muted-fg leading-relaxed text-pretty max-w-2xl">
            {sub}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

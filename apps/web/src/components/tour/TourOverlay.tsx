import { useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';

// A tour step anchors a popover to an element matched by a CSS selector
// (typically `[data-tour="..."]`). The body is i18n-resolved by the
// caller, so this component stays string-free.
export interface TourStep {
  id: string;
  anchor: string;
  title: string;
  body: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

interface TourOverlayProps {
  steps: TourStep[];
  /** Called when the user finishes or dismisses the tour. Idempotent. */
  onClose: () => void;
}

const RETRY_ATTEMPTS = 8;
const RETRY_DELAY_MS = 120;

/**
 * Anchored popover tour. Walks the user through a fixed sequence of
 * steps, each pointing at a real DOM element via CSS selector. Skips
 * steps whose anchor isn't currently in the DOM (e.g., a tab not yet
 * visited, or a supplement card that doesn't apply to this household).
 *
 * Built on Radix Popover + virtualRef so positioning, collision
 * handling, and ESC dismissal come for free — matches the rest of the
 * design system instead of importing a tour library that ships its own
 * theme. See CLAUDE.md ("calm, not gamified").
 */
export function TourOverlay({ steps, onClose }: TourOverlayProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const closedRef = useRef(false);

  const step = steps[index];

  // Resolve the current step's anchor. If it isn't in the DOM yet,
  // retry a few times (the user may have just landed on the route).
  // If still missing after the budget, skip forward — never block
  // the tour on a vanished element.
  useEffect(() => {
    if (!step) return;
    let cancelled = false;
    let attempt = 0;
    function tick() {
      if (cancelled) return;
      const el = document.querySelector(step.anchor) as HTMLElement | null;
      if (el) {
        setAnchorEl(el);
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          /* ignore — older browsers */
        }
        return;
      }
      if (attempt < RETRY_ATTEMPTS) {
        attempt++;
        window.setTimeout(tick, RETRY_DELAY_MS);
        return;
      }
      // Anchor never appeared — skip silently. If this was the last
      // step, finishing closes the tour.
      setAnchorEl(null);
      if (index >= steps.length - 1) close();
      else setIndex(index + 1);
    }
    setAnchorEl(null);
    tick();
    return () => {
      cancelled = true;
    };
    // Only depends on the step identity, not on outer closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  function close() {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  }

  function next() {
    if (index >= steps.length - 1) close();
    else setIndex(index + 1);
  }

  function back() {
    if (index > 0) setIndex(index - 1);
  }

  if (!step || !anchorEl) return null;

  const isLast = index >= steps.length - 1;
  const isFirst = index === 0;
  const progress = `${index + 1} / ${steps.length}`;

  return (
    <Popover.Root open onOpenChange={(open) => { if (!open) close(); }}>
      <Popover.Anchor virtualRef={{ current: anchorEl }} />
      <Popover.Portal>
        <Popover.Content
          side={step.side ?? 'bottom'}
          align="center"
          sideOffset={12}
          collisionPadding={16}
          onEscapeKeyDown={close}
          // Allow clicks outside the popover so the user can still
          // interact with the rest of the page if they want — a "Skip"
          // button is always one click away inside the popover.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            'z-50 w-[20rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-primary/30',
            'bg-surface text-surface-fg shadow-xl',
            'focus:outline-none',
          )}
        >
          <motion.div
            key={step.id}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-black text-foreground leading-tight">
                {step.title}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label={t('onboarding.tour.skip', { defaultValue: 'Skip tour' })}
                className="shrink-0 -mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-fg hover:text-foreground hover:bg-surface-2 transition-colors"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{step.body}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold tabular-nums text-muted-fg">
                {progress}
              </span>
              <div className="ml-auto flex gap-2">
                {!isFirst && (
                  <Button type="button" variant="ghost" size="sm" onClick={back}>
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    {t('onboarding.tour.back', { defaultValue: 'Back' })}
                  </Button>
                )}
                <Button type="button" variant="primary" size="sm" onClick={next}>
                  {isLast ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      {t('onboarding.tour.done', { defaultValue: 'Done' })}
                    </>
                  ) : (
                    <>
                      {t('onboarding.tour.next', { defaultValue: 'Next' })}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
          <Popover.Arrow className="fill-primary/30" width={12} height={6} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

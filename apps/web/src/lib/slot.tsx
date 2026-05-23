import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from './cn';

type AnyProps = Record<string, unknown>;

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(value);
      else (ref as MutableRefObject<T | null>).current = value;
    }
  };
}

function chain<T extends (...args: unknown[]) => unknown>(
  a?: T,
  b?: T,
): T | undefined {
  if (!a) return b;
  if (!b) return a;
  return ((...args: unknown[]) => {
    a(...args);
    return b(...args);
  }) as T;
}

/**
 * Lightweight Radix-style Slot: clones a single child element and merges
 * className, refs, and event handlers from the parent into it. Use it to
 * stamp our styled primitives onto an arbitrary child (e.g. <Link>, <a>).
 */
export function Slot({
  children,
  ...slotProps
}: AnyProps & { children: ReactNode }) {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  const childProps = (child as ReactElement<AnyProps>).props ?? {};

  const merged: AnyProps = { ...childProps, ...slotProps };

  // Merge className and style; chain event handlers; preserve refs.
  if (slotProps.className || childProps.className) {
    merged.className = cn(
      slotProps.className as string | undefined,
      childProps.className as string | undefined,
    );
  }
  if (slotProps.style || childProps.style) {
    merged.style = {
      ...(slotProps.style as CSSProperties | undefined),
      ...(childProps.style as CSSProperties | undefined),
    };
  }
  for (const key of Object.keys(slotProps)) {
    if (key.startsWith('on') && typeof slotProps[key] === 'function') {
      merged[key] = chain(
        slotProps[key] as (...a: unknown[]) => unknown,
        childProps[key] as (...a: unknown[]) => unknown,
      );
    }
  }
  // Forward both refs if the child accepts one.
  const slotRef = (slotProps as { ref?: Ref<unknown> }).ref;
  const childRef = (
    child as ReactElement & { ref?: Ref<unknown> }
  ).ref;
  if (slotRef || childRef) {
    (merged as { ref?: Ref<unknown> }).ref = mergeRefs(slotRef, childRef);
  }

  return cloneElement(child, merged);
}

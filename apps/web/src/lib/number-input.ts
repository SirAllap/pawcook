import type { KeyboardEvent } from 'react';

/**
 * Reject characters that turn a numeric input into something unexpected:
 * scientific notation (`e`, `E`), explicit sign markers, and the comma some
 * locales accept as a decimal separator (we always store dot-decimal).
 */
export function blockBadNumberKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', ',', '-'].includes(e.key)) e.preventDefault();
}

import { toast as sonnerToast, type ExternalToast } from 'sonner';

// Sonner mounts a single live region hard-coded to aria-live="polite", so a
// failure can be missed if a screen reader is mid-utterance. Wrapping error
// content in role="alert" (implicitly assertive) makes the nearest live region
// for that node assertive — the message is announced promptly, and because the
// closest enclosing live region governs its subtree, only once. No visual
// change. We pass through the rare function form of the message (sonner's
// titleT can be a render callback that receives the toast id).
type Message = Parameters<typeof sonnerToast.error>[0];

function assertive(message: Message): Message {
  return typeof message === 'function' ? message : <span role="alert">{message}</span>;
}

// Drop-in replacement for sonner's `toast`: identical surface, except
// `toast.error` announces assertively. Everything else (success/info/warning/
// promise/dismiss/...) is the untouched sonner implementation.
export const toast = Object.assign(
  ((message: Parameters<typeof sonnerToast>[0], data?: ExternalToast) =>
    sonnerToast(message, data)) as typeof sonnerToast,
  sonnerToast,
  {
    error: (message: Message, data?: ExternalToast) => sonnerToast.error(assertive(message), data),
  },
);

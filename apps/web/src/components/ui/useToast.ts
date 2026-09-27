import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastMessage, ToastTone } from './Toast';

/** Estado de un toast que se oculta solo tras `durationMs`. */
export function useToast(durationMs = 3500) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback(
    (text: string, tone: ToastTone = 'success') => {
      window.clearTimeout(timer.current);
      setToast({ text, tone });
      timer.current = window.setTimeout(() => setToast(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, showToast };
}

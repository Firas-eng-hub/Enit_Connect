import { useEffect, useRef } from 'react';

const STEP_MS = 3200;

/**
 * Calls onStep every few seconds while active (on screen, untouched, motion allowed, tab visible).
 * Changing resetKey restarts the countdown.
 */
export function useAutoAdvance(active: boolean, onStep: () => void, resetKey?: string) {
  const onStepRef = useRef(onStep);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') onStepRef.current();
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [active, resetKey]);
}

import { useState, useEffect, useRef, useCallback } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullLength, setPullLength] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startPoint = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const pullStart = useCallback(
    (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startPoint.current = e.targetTouches[0].screenY;
      }
    },
    []
  );

  const pull = useCallback(
    (e: TouchEvent) => {
      if (startPoint.current === 0) return;
      const { screenY } = e.targetTouches[0];
      const length = screenY - startPoint.current;
      if (length > 0) {
        setPullLength(length);
      }
    },
    []
  );

  const endPull = useCallback(async () => {
    if (startPoint.current === 0) return;
    startPoint.current = 0;
    if (pullLength > 220) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullLength(0);
  }, [pullLength, onRefresh]);

  useEffect(() => {
    window.addEventListener('touchstart', pullStart, { passive: true });
    window.addEventListener('touchmove', pull, { passive: true });
    window.addEventListener('touchend', endPull);
    return () => {
      window.removeEventListener('touchstart', pullStart);
      window.removeEventListener('touchmove', pull);
      window.removeEventListener('touchend', endPull);
    };
  }, [pullStart, pull, endPull]);

  const indicatorStyle = {
    marginTop: refreshing ? 70 : Math.min(pullLength / 3.118, 70),
    opacity: Math.min(pullLength / 100, 1),
  };

  const iconStyle = {
    transform: `rotate(${refreshing ? 0 : pullLength}deg)`,
  };

  return { containerRef, indicatorStyle, iconStyle, refreshing, pullLength };
}

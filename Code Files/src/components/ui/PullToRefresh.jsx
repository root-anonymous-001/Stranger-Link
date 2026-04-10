import React, { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const pullYRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      isPulling = false;
    };

    const handleTouchMove = (e) => {
      if (isRefreshingRef.current) return;
      if (el.scrollTop > 0) return;
      const delta = e.touches[0].clientY - startY;
      if (delta > 0) {
        isPulling = true;
        e.preventDefault();
        const newPull = Math.min(delta * 0.4, THRESHOLD + 20);
        pullYRef.current = newPull;
        setPullY(newPull);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      isPulling = false;
      if (pullYRef.current >= THRESHOLD && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setPullY(THRESHOLD);
        await onRefreshRef.current();
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      }
      pullYRef.current = 0;
      setPullY(0);
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {(pullY > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex justify-center items-end z-20 pointer-events-none"
          style={{ height: `${isRefreshing ? THRESHOLD : pullY}px` }}
        >
          <div className="mb-2 w-9 h-9 rounded-full bg-[#0d0d25] border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <RefreshCw
              className="w-4 h-4 text-indigo-400"
              style={{
                transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
                animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
              }}
            />
          </div>
        </div>
      )}
      <div
        style={{
          transform: `translateY(${pullY}px)`,
          transition: isRefreshing || pullY === 0 ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
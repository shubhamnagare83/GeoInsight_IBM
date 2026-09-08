import { useEffect, useRef, useState, type ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  sublabel: string;
  value: number | null;
  unit: string;
  decimals?: number;
  color: string;
  delay?: number;
}

export default function MetricCard({
  icon,
  label,
  sublabel,
  value,
  unit,
  decimals = 0,
  color,
  delay = 0,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (value === null) {
      setDisplayValue(0);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    const startVal = displayValue;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startVal + (value! - startVal) * eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted = value !== null ? displayValue.toFixed(decimals) : '—';

  return (
    <div
      className={`glass-card p-4 flex flex-col gap-2 min-w-[160px] transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`${color} opacity-80`}>{icon}</div>
        <div>
          <p className="label-xs">{label}</p>
          <p className="text-[0.6rem] text-geo-text-muted">{sublabel}</p>
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={`metric-value ${color}`}>{formatted}</span>
        <span className="text-xs text-geo-text-muted">{unit}</span>
      </div>
    </div>
  );
}

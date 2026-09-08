interface LegendProps {
  title: string;
  gradient: string;
  labels: string[];
  visible: boolean;
}

export default function Legend({ title, gradient, labels, visible }: LegendProps) {
  if (!visible) return null;

  return (
    <div className="glass-panel p-2.5 animate-fade-in min-w-[140px]">
      <p className="label-xs text-geo-text-dim mb-2">{title}</p>
      <div
        className="h-2 rounded-sm mb-1.5"
        style={{ background: gradient }}
      />
      <div className="flex justify-between">
        {labels.map((l, i) => (
          <span key={i} className="text-[0.55rem] text-geo-text-muted">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

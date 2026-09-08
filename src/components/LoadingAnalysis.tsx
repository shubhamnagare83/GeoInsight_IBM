import { useApp } from '../context/AppContext';
import { CheckCircle2, Circle, Loader2, Satellite } from 'lucide-react';

export default function LoadingAnalysis() {
  const { isLoading, steps, district } = useApp();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-geo-darker/60 backdrop-blur-sm">
      <div className="glass-panel-solid p-6 w-80 animate-fade-in glow-cyan">
        <div className="flex items-center gap-2.5 mb-4">
          <Satellite className="w-5 h-5 text-geo-cyan animate-pulse" />
          <div>
            <p className="text-xs font-semibold tracking-wider text-geo-cyan">
              ANALYZING {district.toUpperCase()}
            </p>
            <p className="label-xs text-geo-text-muted mt-0.5">
              Processing geospatial data
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`loading-step ${step.status === 'complete' ? 'complete' : ''} ${
                step.status === 'loading' ? 'active' : ''
              }`}
            >
              <div className="step-icon">
                {step.status === 'complete' && (
                  <CheckCircle2 className="w-4 h-4 text-geo-green" />
                )}
                {step.status === 'loading' && (
                  <Loader2 className="w-4 h-4 text-geo-cyan animate-spin" />
                )}
                {step.status === 'pending' && (
                  <Circle className="w-4 h-4 text-geo-text-muted opacity-40" />
                )}
              </div>
              <span>{step.label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-0.5 bg-geo-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-geo-cyan to-geo-green transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${(steps.filter((s) => s.status === 'complete').length / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

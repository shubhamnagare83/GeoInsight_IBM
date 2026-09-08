import { useApp } from '../context/AppContext';
import { Brain, Sparkles } from 'lucide-react';

export default function InsightPanel() {
  const { environmentData, isComplete, isDemoMode } = useApp();

  if (!isComplete || !environmentData?.insight) return null;

  return (
    <div className="glass-panel p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2.5">
        <Brain className="w-4 h-4 text-geo-cyan" />
        <span className="label-xs text-geo-cyan">AI ENVIRONMENTAL INSIGHT</span>
        {isDemoMode && (
          <span className="label-xs text-amber-400 ml-auto">DEMO DATA</span>
        )}
        <Sparkles className="w-3 h-3 text-geo-cyan opacity-50" />
      </div>
      <p className="text-sm leading-relaxed text-geo-text-dim">
        {environmentData.insight}
      </p>
    </div>
  );
}

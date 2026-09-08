import { useApp } from '../context/AppContext';
import { Satellite, Signal, AlertCircle, Box, Globe, SplitSquareVertical, LogOut, Map } from 'lucide-react';
import type { ViewMode } from '../types/api';

export default function TopBar({ onLock }: { onLock?: () => void }) {
  const { isDemoMode, isComplete, isLoading, error, viewMode, setViewMode, district } = useApp();

  const VIEW_MODES: { id: ViewMode; label: string; icon: typeof Box }[] = [
    { id: 'globe', label: '3D World Globe', icon: Globe },
    { id: '3d', label: '3D Digital Twin', icon: Box },
    { id: 'google-map', label: 'Google Maps GIS', icon: Map },
    { id: 'split', label: 'Split View', icon: SplitSquareVertical },
  ];

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-geo-border bg-geo-darker/90 backdrop-blur-xl z-50 relative">
      {/* Left — Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-geo-cyan animate-pulse" />
          <span className="text-sm font-bold tracking-wider text-geo-text font-mono">
            GEOINSIGHT
          </span>
        </div>
        <span className="hidden sm:block label-xs text-geo-text-muted font-mono">
          {district.toUpperCase()} • ASSAM
        </span>
      </div>

      {/* Center — Multi-Engine View Switcher */}
      <div className="flex items-center p-0.5 rounded-lg bg-geo-panel border border-geo-border">
        {VIEW_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? 'bg-geo-cyan/20 text-geo-cyan border border-geo-cyan/40 shadow-sm'
                  : 'text-geo-text-dim hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right — Status */}
      <div className="flex items-center gap-3">
        {error && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-geo-red" />
            <span className="label-xs text-geo-red">ERROR</span>
          </div>
        )}

        {isDemoMode && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            <span className="label-xs text-amber-400 font-mono">DEMO</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Signal className="w-3.5 h-3.5 text-geo-text-muted" />
          <div
            className={`pulse-dot ${
              isLoading ? 'demo' : isComplete ? 'live' : 'demo'
            }`}
          />
          <span
            className={`label-xs font-mono ${
              isLoading
                ? 'text-geo-amber'
                : isComplete
                ? 'text-geo-green'
                : 'text-geo-text-muted'
            }`}
          >
            {isLoading ? 'ANALYZING' : isComplete ? 'LIVE' : 'STANDBY'}
          </span>
        </div>

        {onLock && (
          <button
            onClick={onLock}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-geo-panel border border-geo-border text-geo-text-muted hover:text-geo-cyan hover:border-geo-cyan/40 transition-all cursor-pointer text-xs"
            title="Lock Session / Return to 3D Globe Login"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[0.65rem] font-mono">LOCK</span>
          </button>
        )}
      </div>
    </header>
  );
}

import { useApp } from '../../context/AppContext';
import {
  X,
  Activity,
  Eye,
  Compass,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

export default function StationInfoWindow() {
  const { selectedStation, setSelectedStation, setStreetViewStation } = useApp();

  if (!selectedStation) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'text-geo-green bg-emerald-500/10 border-emerald-500/20';
      case 'monitoring':
        return 'text-geo-cyan bg-cyan-500/10 border-cyan-500/20';
      case 'warning':
      case 'alert':
        return 'text-geo-amber bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-geo-text-dim bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="absolute bottom-5 right-5 z-30 w-96 max-w-[calc(100vw-40px)] glass-panel-solid p-4 border border-geo-cyan/30 shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded border font-mono ${getStatusColor(
                selectedStation.status
              )}`}
            >
              {selectedStation.status.toUpperCase()}
            </span>
            <span className="text-[0.65rem] text-geo-text-muted font-mono">
              {selectedStation.category}
            </span>
          </div>
          <h3 className="text-sm font-bold text-geo-text leading-tight">
            {selectedStation.name}
          </h3>
        </div>
        <button
          onClick={() => setSelectedStation(null)}
          className="p-1 rounded hover:bg-white/10 text-geo-text-dim hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-geo-darker/70 border border-geo-border mb-3">
        <div className="text-center">
          <p className="text-[0.6rem] text-geo-text-muted font-medium">LOCAL NDVI</p>
          <p className="text-base font-bold text-geo-green font-mono">
            {selectedStation.ndvi.toFixed(2)}
          </p>
        </div>
        <div className="text-center border-x border-geo-border">
          <p className="text-[0.6rem] text-geo-text-muted font-medium">PRECIPITATION</p>
          <p className="text-base font-bold text-geo-blue font-mono">
            {selectedStation.rainfallMm} <span className="text-[0.65rem] font-normal">mm</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[0.6rem] text-geo-text-muted font-medium">SURFACE TEMP</p>
          <p className="text-base font-bold text-amber-400 font-mono">
            {selectedStation.temperatureC}° <span className="text-[0.65rem] font-normal">C</span>
          </p>
        </div>
      </div>

      {/* Water & Ecological Metric */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-cyan-500/5 border border-cyan-500/15 mb-2.5">
        <Activity className="w-3.5 h-3.5 text-geo-cyan flex-shrink-0" />
        <span className="text-xs text-cyan-200 font-mono">
          {selectedStation.waterMetric}
        </span>
      </div>

      {/* Description & Ground Truth Notes */}
      <p className="text-xs text-geo-text-dim leading-relaxed mb-2.5">
        {selectedStation.description}
      </p>

      <div className="p-2 rounded bg-geo-darker/50 border border-geo-border/60 text-[0.68rem] text-geo-text-muted mb-3 space-y-1">
        <div className="flex items-center gap-1.5 text-geo-cyan font-medium">
          <CheckCircle2 className="w-3 h-3" />
          <span>SATELLITE GROUND-TRUTHING</span>
        </div>
        <p className="text-geo-text-dim italic">
          "{selectedStation.groundTruthNote}"
        </p>
        <div className="flex items-center gap-1 text-[0.6rem] text-geo-text-muted pt-1 border-t border-geo-border/40">
          <Cpu className="w-3 h-3 text-geo-text-dim" />
          <span>Sensor: {selectedStation.sensorSpecs}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-geo-border">
        <div className="flex items-center gap-1.5 text-[0.65rem] text-geo-text-muted font-mono">
          <Compass className="w-3 h-3" />
          <span>{selectedStation.lat.toFixed(4)}°N, {selectedStation.lng.toFixed(4)}°E</span>
        </div>

        <button
          onClick={() => setStreetViewStation(selectedStation)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-geo-cyan/15 hover:bg-geo-cyan/25 border border-geo-cyan/40 text-geo-cyan text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Street View / Ground Truth</span>
        </button>
      </div>
    </div>
  );
}

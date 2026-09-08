import { useApp } from '../context/AppContext';
import { Search, Layers, MapPin, Calendar } from 'lucide-react';
import type { LayerVisibility } from '../types/api';

const DISTRICTS = [
  { value: 'kamrup', label: 'Kamrup, Assam' },
];

const MONTHS = [
  { value: '2026-01', label: 'January 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-08', label: 'August 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'December 2026' },
];

const LAYER_CONFIG: { key: keyof LayerVisibility; label: string; color: string }[] = [
  { key: 'boundary', label: 'District Boundary', color: 'bg-geo-cyan' },
  { key: 'ndvi', label: 'NDVI Vegetation', color: 'bg-geo-green' },
  { key: 'water', label: 'Surface Water', color: 'bg-geo-blue' },
  { key: 'rainfall', label: 'Rainfall', color: 'bg-geo-amber' },
];

export default function ControlPanel() {
  const { district, month, setDistrict, setMonth, layers, toggleLayer, analyze, isLoading } = useApp();

  return (
    <aside className="control-panel glass-panel-solid p-4 flex flex-col gap-5 w-full lg:w-72 overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-xs font-bold tracking-widest text-geo-cyan mb-0.5">
          GEOINSIGHT
        </h2>
        <p className="label-xs text-geo-text-muted">GEOSPATIAL ANALYSIS</p>
      </div>

      <div className="w-full h-px bg-geo-border" />

      {/* District Selector */}
      <div>
        <label className="label-xs flex items-center gap-1.5 mb-2">
          <MapPin className="w-3 h-3" />
          DISTRICT
        </label>
        <select
          className="geo-select"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={isLoading}
        >
          {DISTRICTS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Month Selector */}
      <div>
        <label className="label-xs flex items-center gap-1.5 mb-2">
          <Calendar className="w-3 h-3" />
          MONTH
        </label>
        <select
          className="geo-select"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={isLoading}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Analyze Button */}
      <button
        className="btn-primary w-full flex items-center justify-center gap-2"
        onClick={analyze}
        disabled={isLoading}
      >
        <Search className="w-4 h-4" />
        {isLoading ? 'ANALYZING...' : 'ANALYZE DISTRICT'}
      </button>

      <div className="w-full h-px bg-geo-border" />

      {/* Layer Controls */}
      <div>
        <label className="label-xs flex items-center gap-1.5 mb-3">
          <Layers className="w-3 h-3" />
          LAYERS
        </label>
        <div className="flex flex-col gap-2.5">
          {LAYER_CONFIG.map((layer) => (
            <button
              key={layer.key}
              onClick={() => toggleLayer(layer.key)}
              className="flex items-center justify-between gap-2 group cursor-pointer bg-transparent border-none p-0"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full ${layer.color} ${
                    layers[layer.key] ? 'opacity-100' : 'opacity-30'
                  } transition-opacity`}
                />
                <span
                  className={`text-xs ${
                    layers[layer.key] ? 'text-geo-text' : 'text-geo-text-muted'
                  } transition-colors`}
                >
                  {layer.label}
                </span>
              </div>
              <div
                className={`toggle-switch ${layers[layer.key] ? 'active' : ''}`}
              />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KAMRUP_LANDMARKS } from '../../data/groundStations';
import type { MapType } from '../../types/api';
import {
  Ruler,
  Square,
  Crosshair,
  Trash2,
  Search,
  Key,
  Map as MapIcon,
  Globe,
  Layers,
  Moon,
  ChevronDown,
} from 'lucide-react';

export default function MapToolsBar() {
  const {
    activeMapType,
    setActiveMapType,
    activeTool,
    setActiveTool,
    clearMeasurements,
    measurementPoints,
    probeResult,
    setFlyToTarget,
    googleMapsApiKey,
    setGoogleMapsApiKey,
  } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState(googleMapsApiKey);

  const MAP_TYPES: { id: MapType; label: string; icon: typeof Globe }[] = [
    { id: 'satellite', label: 'Google Satellite', icon: Globe },
    { id: 'hybrid', label: 'Google Hybrid', icon: Layers },
    { id: 'terrain', label: 'Google Terrain', icon: MapIcon },
    { id: 'dark', label: 'Tactical Dark', icon: Moon },
  ];

  return (
    <>
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* 1. Google Map Type Switcher */}
        <div className="glass-panel p-1 flex items-center gap-1 border border-geo-border">
          {MAP_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = activeMapType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setActiveMapType(type.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-geo-cyan/20 text-geo-cyan border border-geo-cyan/40 shadow-sm'
                    : 'text-geo-text-dim hover:text-white hover:bg-white/5'
                }`}
                title={type.label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[0.7rem]">{type.label.replace('Google ', '')}</span>
              </button>
            );
          })}
        </div>

        {/* 2. GIS Measurement & Probe Tools */}
        <div className="glass-panel p-1 flex items-center gap-1 border border-geo-border">
          {/* Distance Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'measure-distance' ? 'none' : 'measure-distance')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
              activeTool === 'measure-distance'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-geo-text-dim hover:text-white hover:bg-white/5'
            }`}
            title="Measure Distance (Click points on map)"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[0.7rem]">Distance</span>
          </button>

          {/* Area Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'measure-area' ? 'none' : 'measure-area')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
              activeTool === 'measure-area'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-geo-text-dim hover:text-white hover:bg-white/5'
            }`}
            title="Measure Area (Click 3+ points)"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[0.7rem]">Area</span>
          </button>

          {/* Coordinate Probe Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'probe' ? 'none' : 'probe')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
              activeTool === 'probe'
                ? 'bg-geo-cyan/20 text-geo-cyan border border-geo-cyan/40'
                : 'text-geo-text-dim hover:text-white hover:bg-white/5'
            }`}
            title="Point Probe (Click anywhere for Lat/Lng, NDVI & Elevation)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[0.7rem]">Probe</span>
          </button>

          {/* Clear Measurements */}
          {(measurementPoints.length > 0 || probeResult) && (
            <button
              onClick={clearMeasurements}
              className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
              title="Clear GIS Measurements"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Location Quick-Search Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="glass-panel px-3 py-1.5 flex items-center gap-2 text-xs text-geo-text hover:text-geo-cyan border border-geo-border transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-geo-cyan" />
            <span className="text-[0.7rem] font-medium hidden sm:inline">Jump to Location</span>
            <ChevronDown className="w-3 h-3 text-geo-text-muted" />
          </button>

          {searchOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 glass-panel-solid p-1.5 rounded-lg border border-geo-border shadow-2xl z-30 animate-fade-in max-h-64 overflow-y-auto">
              <p className="px-2 py-1 text-[0.65rem] font-bold tracking-wider text-geo-text-muted uppercase">
                Kamrup Key Regions
              </p>
              {KAMRUP_LANDMARKS.map((landmark) => (
                <button
                  key={landmark.name}
                  onClick={() => {
                    setFlyToTarget({ lat: landmark.lat, lng: landmark.lng, zoom: landmark.zoom });
                    setSearchOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-geo-text hover:text-geo-cyan hover:bg-geo-cyan/10 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{landmark.name}</span>
                  <span className="text-[0.6rem] font-mono text-geo-text-muted">
                    {landmark.lat.toFixed(2)}°, {landmark.lng.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Google Maps API Key Config Button */}
        <button
          onClick={() => setKeyModalOpen(true)}
          className="glass-panel p-2 rounded text-geo-text-dim hover:text-geo-cyan hover:border-geo-cyan/40 border border-geo-border transition-colors cursor-pointer"
          title="Google Maps API Key Configuration"
        >
          <Key className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* API Key Modal */}
      {keyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-geo-darker/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel-solid p-5 w-full max-w-md border border-geo-cyan/40 rounded-xl">
            <h3 className="text-sm font-bold text-geo-text flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-geo-cyan" />
              Google Maps API Configuration
            </h3>
            <p className="text-xs text-geo-text-dim leading-relaxed mb-3">
              GeoInsight is equipped with high-resolution Google Satellite, Hybrid, Terrain, and Dark tile feeds that run seamlessly out-of-the-box. If you have an enterprise Google Cloud API Key, enter it below to enable advanced vector 3D buildings and Street View metadata.
            </p>
            <input
              type="text"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded bg-geo-darker border border-geo-border text-xs text-geo-text font-mono mb-4 focus:outline-none focus:border-geo-cyan"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setKeyModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-geo-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setGoogleMapsApiKey(tempKey);
                  setKeyModalOpen(false);
                }}
                className="btn-primary py-1.5 px-4 text-xs"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

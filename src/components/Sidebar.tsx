import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { LayerVisibility } from '../types/api';
import type { ViewMode } from '../types/api';
import {
  Search, Layers, MapPin, Calendar, ChevronLeft, ChevronRight,
  Box, Globe, SplitSquareVertical, Satellite, Database,
  TreePine, Droplets, CloudRain, Hexagon, LogOut, Map
} from 'lucide-react';

const DISTRICTS = [
  { value: 'kamrup', label: 'Kamrup, Assam' },
  { value: 'nagaon', label: 'Nagaon, Assam' },
  { value: 'sonitpur', label: 'Sonitpur, Assam' },
  { value: 'dibrugarh', label: 'Dibrugarh, Assam' },
  { value: 'jorhat', label: 'Jorhat, Assam' },
  { value: 'goalpara', label: 'Goalpara, Assam' },
  { value: 'barpeta', label: 'Barpeta, Assam' },
  { value: 'darrang', label: 'Darrang, Assam' },
  { value: 'cachar', label: 'Cachar, Assam' },
  { value: 'tinsukia', label: 'Tinsukia, Assam' },
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

const LAYER_CONFIG: { key: keyof LayerVisibility; label: string; icon: typeof TreePine; color: string }[] = [
  { key: 'boundary', label: 'District Boundary', icon: Hexagon, color: '#00d4ff' },
  { key: 'ndvi', label: 'NDVI Vegetation', icon: TreePine, color: '#00e676' },
  { key: 'water', label: 'Surface Water', icon: Droplets, color: '#2196f3' },
  { key: 'rainfall', label: 'Rainfall', icon: CloudRain, color: '#ffab00' },
];

const VIEW_MODES: { id: ViewMode; label: string; icon: typeof Box }[] = [
  { id: 'globe', label: '3D World Globe', icon: Globe },
  { id: '3d', label: '3D Digital Twin', icon: Box },
  { id: 'google-map', label: 'Google Maps GIS', icon: Map },
  { id: 'split', label: 'Split View', icon: SplitSquareVertical },
];

export default function Sidebar({ onLock }: { onLock?: () => void }) {
  const {
    district, month, setDistrict, setMonth,
    layers, toggleLayer,
    analyze, isLoading,
    viewMode, setViewMode,
    isDemoMode,
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Collapse Toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand */}
      <div className="sidebar-brand">
        <Satellite className="w-5 h-5 text-geo-cyan sidebar-brand-icon" />
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">GEOINSIGHT</span>
            <span className="sidebar-brand-sub">INTELLIGENCE PLATFORM</span>
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* View Mode Switcher */}
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-section-title">VIEW MODE</div>}
        <div className="sidebar-view-modes">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`sidebar-view-btn ${isActive ? 'sidebar-view-btn--active' : ''}`}
                title={mode.label}
              >
                <Icon className="w-4 h-4" />
                {!collapsed && <span>{mode.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* District Selector */}
      <div className="sidebar-section">
        {!collapsed && (
          <div className="sidebar-section-title">
            <MapPin className="w-3 h-3" />
            DISTRICT
          </div>
        )}
        {collapsed ? (
          <button className="sidebar-icon-btn" title="District">
            <MapPin className="w-4 h-4" />
          </button>
        ) : (
          <select
            className="geo-select sidebar-select"
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
        )}
      </div>

      {/* Month Selector */}
      <div className="sidebar-section">
        {!collapsed && (
          <div className="sidebar-section-title">
            <Calendar className="w-3 h-3" />
            MONTH
          </div>
        )}
        {collapsed ? (
          <button className="sidebar-icon-btn" title="Month">
            <Calendar className="w-4 h-4" />
          </button>
        ) : (
          <select
            className="geo-select sidebar-select"
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
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Layer Controls */}
      <div className="sidebar-section">
        {!collapsed && (
          <div className="sidebar-section-title">
            <Layers className="w-3 h-3" />
            LAYERS
          </div>
        )}
        <div className="sidebar-layers">
          {LAYER_CONFIG.map((layer) => {
            const Icon = layer.icon;
            const active = layers[layer.key];
            return (
              <button
                key={layer.key}
                onClick={() => toggleLayer(layer.key)}
                className={`sidebar-layer-btn ${active ? 'sidebar-layer-btn--active' : ''}`}
                title={layer.label}
              >
                <div className="sidebar-layer-indicator" style={{ background: active ? layer.color : 'transparent', borderColor: layer.color }} />
                <Icon className="w-4 h-4" style={{ color: active ? layer.color : undefined }} />
                {!collapsed && <span>{layer.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Data Source */}
      <div className="sidebar-section">
        {!collapsed && (
          <div className="sidebar-section-title">
            <Database className="w-3 h-3" />
            DATA SOURCE
          </div>
        )}
        {collapsed ? (
          <button className="sidebar-icon-btn" title="Data Source">
            <Database className="w-4 h-4" />
          </button>
        ) : (
          <div className="sidebar-data-source">
            <div className="sidebar-data-item">
              <div className="sidebar-data-dot" style={{ background: '#00e676' }} />
              <span>Sentinel-2 MSI</span>
            </div>
            <div className="sidebar-data-item">
              <div className="sidebar-data-dot" style={{ background: '#2196f3' }} />
              <span>CHIRPS Rainfall</span>
            </div>
            <div className="sidebar-data-item">
              <div className="sidebar-data-dot" style={{ background: '#00d4ff' }} />
              <span>JRC Surface Water</span>
            </div>
            {isDemoMode && (
              <div className="sidebar-demo-badge">
                <span>DEMO MODE</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Analyze Button */}
      <div className="sidebar-section sidebar-analyze">
        {collapsed ? (
          <button
            className="sidebar-analyze-btn-icon"
            onClick={analyze}
            disabled={isLoading}
            title="Analyze District"
          >
            <Search className="w-5 h-5" />
          </button>
        ) : (
          <button
            className="btn-primary w-full flex items-center justify-center gap-2"
            onClick={analyze}
            disabled={isLoading}
          >
            <Search className="w-4 h-4" />
            {isLoading ? 'ANALYZING...' : 'ANALYZE DISTRICT'}
          </button>
        )}
      </div>

      {onLock && (
        <div className="sidebar-section pt-1">
          {collapsed ? (
            <button
              className="sidebar-icon-btn text-geo-text-muted hover:text-geo-cyan"
              onClick={onLock}
              title="Return to 3D Globe Login"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[0.7rem] font-mono text-geo-text-muted hover:text-geo-cyan hover:bg-white/5 border border-geo-border transition-all cursor-pointer"
              onClick={onLock}
              title="Return to 3D Globe Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOCK / GLOBE VIEW</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import WorldGlobe from './components/three/WorldGlobe';
import GeoScene from './components/three/GeoScene';
import GoogleMapViewer from './components/map/GoogleMapViewer';
import SplitView from './components/map/SplitView';
import StreetViewModal from './components/map/StreetViewModal';
import MetricsPanel from './components/MetricsPanel';
import InsightPanel from './components/InsightPanel';
import Legend from './components/Legend';
import LoadingAnalysis from './components/LoadingAnalysis';
import LoginPage from './components/login/LoginPage';

function Dashboard({ onLock }: { onLock: () => void }) {
  const { analyze, layers, viewMode } = useApp();

  // Run initial analysis on load to trigger cinematic satellite scan
  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-geo-darker text-geo-text">
      {/* 1. Header Bar with View Mode Switcher and Lock Option */}
      <TopBar onLock={onLock} />

      {/* 2. Main Middle Area (Unified Sidebar + Dynamic Map/Globe Viewport) */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Unified Collapsible Sidebar containing ALL controls */}
        <Sidebar onLock={onLock} />

        {/* Center/Main: Geospatial Viewport (3D World Globe, 3D Digital Twin, Google Maps GIS, or Split View) */}
        <div className="flex-1 relative h-full min-h-[350px]">
          {viewMode === 'globe' && <WorldGlobe />}
          {viewMode === '3d' && <GeoScene />}
          {viewMode === 'google-map' && <GoogleMapViewer />}
          {viewMode === 'split' && <SplitView />}

          {/* Floating Legends Overlay in top-right / middle right */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5 max-w-[220px]">
            {/* NDVI Legend */}
            <Legend
              title="NDVI VEGETATION INDEX"
              gradient="linear-gradient(to right, #5a4b32 0%, #a07a28 20%, #c8c828 45%, #2eb82e 75%, #0f691e 100%)"
              labels={['-1.0', '0.0', '0.25', '0.50', '0.75', '1.0']}
              visible={layers.ndvi}
            />

            {/* Surface Water Legend */}
            {layers.water && (
              <div className="glass-panel p-2.5 animate-fade-in min-w-[140px]">
                <p className="label-xs text-geo-text-dim mb-1.5">SURFACE WATER</p>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-sm bg-cyan-400 opacity-80" />
                  <span className="text-[0.65rem] text-geo-text font-medium">Water Occurrence</span>
                </div>
                <div className="flex justify-between text-[0.6rem] text-geo-text-muted mt-1">
                  <span>Channel</span>
                  <span className="text-geo-cyan">Brahmaputra Basin</span>
                </div>
              </div>
            )}

            {/* Rainfall Legend */}
            <Legend
              title="RAINFALL INTENSITY (CHIRPS)"
              gradient="linear-gradient(to right, #324682 0%, #4a5db5 40%, #784eb5 80%, #b54e96 100%)"
              labels={['Low', '200mm', '400mm', '600mm+']}
              visible={layers.rainfall}
            />
          </div>

          {/* Full-Screen Loading Analysis Overlay */}
          <LoadingAnalysis />
        </div>
      </div>

      {/* 3. Bottom Panels (KPI Metrics + AI Environmental Insight) */}
      <div className="border-t border-geo-border bg-geo-darker/90 backdrop-blur-xl z-30 flex flex-col divide-y divide-geo-border">
        {/* Four Metric KPI Cards */}
        <MetricsPanel />

        {/* AI Environmental Insight Statement */}
        <div className="px-4 py-2.5">
          <InsightPanel />
        </div>
      </div>

      {/* 4. Ground-Truth Street View Modal */}
      <StreetViewModal />
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<'login' | 'dashboard'>('login');

  return (
    <AppProvider>
      {screen === 'login' ? (
        <LoginPage onTransitionStart={() => setScreen('dashboard')} />
      ) : (
        <div className="dashboard-enter w-screen h-screen overflow-hidden">
          <Dashboard onLock={() => setScreen('login')} />
        </div>
      )}
    </AppProvider>
  );
}

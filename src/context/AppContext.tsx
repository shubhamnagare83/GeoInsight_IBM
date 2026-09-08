import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  EnvironmentData,
  LayerData,
  LayerVisibility,
  AnalysisStep,
  ViewMode,
  MapType,
  ActiveTool,
  GroundStation,
  ProbeData,
  MeasurementPoint,
} from '../types/api';
import {
  fetchEnvironmentData,
  fetchLayerData,
  checkBackendHealth,
  getDemoEnvironmentData,
  getDemoLayerData,
} from '../services/api';

interface AppState {
  // Selection
  district: string;
  month: string;
  setDistrict: (d: string) => void;
  setMonth: (m: string) => void;

  // Analysis
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
  steps: AnalysisStep[];
  environmentData: EnvironmentData | null;
  layerData: LayerData | null;

  // Mode
  isDemoMode: boolean;
  setDemoMode: (v: boolean) => void;

  // Layers
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;

  // Actions
  analyze: () => Promise<void>;

  // ─── Google Maps & GIS Features ───────────────────────────
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  activeMapType: MapType;
  setActiveMapType: (t: MapType) => void;
  activeTool: ActiveTool;
  setActiveTool: (t: ActiveTool) => void;
  selectedStation: GroundStation | null;
  setSelectedStation: (s: GroundStation | null) => void;
  streetViewStation: GroundStation | null;
  setStreetViewStation: (s: GroundStation | null) => void;
  probeResult: ProbeData | null;
  setProbeResult: (p: ProbeData | null) => void;
  measurementPoints: MeasurementPoint[];
  setMeasurementPoints: (pts: MeasurementPoint[] | ((prev: MeasurementPoint[]) => MeasurementPoint[])) => void;
  clearMeasurements: () => void;
  flyToTarget: { lat: number; lng: number; zoom: number } | null;
  setFlyToTarget: (target: { lat: number; lng: number; zoom: number } | null) => void;
  googleMapsApiKey: string;
  setGoogleMapsApiKey: (key: string) => void;
}

const AppContext = createContext<AppState | null>(null);

const INITIAL_STEPS: AnalysisStep[] = [
  { id: 'boundary', label: 'Loading district boundary', status: 'pending' },
  { id: 'sentinel', label: 'Processing Sentinel-2 imagery', status: 'pending' },
  { id: 'ndvi', label: 'Calculating vegetation index', status: 'pending' },
  { id: 'rainfall', label: 'Processing CHIRPS rainfall', status: 'pending' },
  { id: 'water', label: 'Calculating surface water', status: 'pending' },
  { id: 'insight', label: 'Generating environmental insight', status: 'pending' },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [district, setDistrict] = useState('kamrup');
  const [month, setMonth] = useState('2026-06');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AnalysisStep[]>(INITIAL_STEPS);
  const [environmentData, setEnvironmentData] = useState<EnvironmentData | null>(null);
  const [layerData, setLayerData] = useState<LayerData | null>(null);
  const [isDemoMode, setDemoMode] = useState(false);
  const [layers, setLayers] = useState<LayerVisibility>({
    boundary: true,
    ndvi: true,
    water: true,
    rainfall: false,
  });

  // Google Maps & GIS state
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [activeMapType, setActiveMapType] = useState<MapType>('satellite');
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [selectedStation, setSelectedStation] = useState<GroundStation | null>(null);
  const [streetViewStation, setStreetViewStation] = useState<GroundStation | null>(null);
  const [probeResult, setProbeResult] = useState<ProbeData | null>(null);
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );

  const clearMeasurements = useCallback(() => {
    setMeasurementPoints([]);
    setProbeResult(null);
  }, []);

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const updateStep = useCallback((id: string, status: AnalysisStep['status']) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }, []);

  const analyze = useCallback(async () => {
    setIsLoading(true);
    setIsComplete(false);
    setError(null);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' as const })));

    try {
      // Check backend availability
      const isBackendUp = await checkBackendHealth();
      const useDemo = !isBackendUp;

      if (useDemo && !isDemoMode) {
        setDemoMode(true);
      }

      // Step 1: Boundary
      updateStep('boundary', 'loading');
      await sleep(400);
      updateStep('boundary', 'complete');

      // Step 2: Sentinel-2
      updateStep('sentinel', 'loading');
      await sleep(600);
      updateStep('sentinel', 'complete');

      // Step 3: NDVI
      updateStep('ndvi', 'loading');
      await sleep(500);

      // Step 4: Rainfall (parallel with NDVI completion)
      updateStep('rainfall', 'loading');

      let envData: EnvironmentData;
      let lyrData: LayerData;

      if (useDemo) {
        envData = getDemoEnvironmentData(month);
        lyrData = getDemoLayerData(month);
        await sleep(400);
      } else {
        try {
          const [env, lyr] = await Promise.all([
            fetchEnvironmentData(district, month),
            fetchLayerData(district, month),
          ]);
          envData = env;
          lyrData = lyr;
        } catch {
          // Fallback to demo
          setDemoMode(true);
          envData = getDemoEnvironmentData(month);
          lyrData = getDemoLayerData(month);
        }
      }

      updateStep('ndvi', 'complete');
      updateStep('rainfall', 'complete');

      // Step 5: Water
      updateStep('water', 'loading');
      await sleep(300);
      updateStep('water', 'complete');

      // Step 6: Insight
      updateStep('insight', 'loading');
      await sleep(300);
      updateStep('insight', 'complete');

      setEnvironmentData(envData);
      setLayerData(lyrData);
      setIsComplete(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Geospatial analysis service unavailable.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [district, month, isDemoMode, updateStep]);

  return (
    <AppContext.Provider
      value={{
        district,
        month,
        setDistrict,
        setMonth,
        isLoading,
        isComplete,
        error,
        steps,
        environmentData,
        layerData,
        isDemoMode,
        setDemoMode,
        layers,
        toggleLayer,
        analyze,
        viewMode,
        setViewMode,
        activeMapType,
        setActiveMapType,
        activeTool,
        setActiveTool,
        selectedStation,
        setSelectedStation,
        streetViewStation,
        setStreetViewStation,
        probeResult,
        setProbeResult,
        measurementPoints,
        setMeasurementPoints,
        clearMeasurements,
        flyToTarget,
        setFlyToTarget,
        googleMapsApiKey,
        setGoogleMapsApiKey,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

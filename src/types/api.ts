/**
 * GeoInsight — TypeScript API & GIS interfaces
 * Mirrors backend models and adds advanced Google Maps / GIS capabilities.
 */

export interface VegetationData {
  average_ndvi: number;
  min_ndvi?: number;
  max_ndvi?: number;
}

export interface RainfallData {
  metric: string;
  value_mm: number;
}

export interface SurfaceWaterData {
  coverage_percent: number;
  area_km2: number;
}

export interface EnvironmentData {
  district: string;
  state: string;
  month: string;
  vegetation: VegetationData;
  rainfall: RainfallData;
  surface_water: SurfaceWaterData;
  insight?: string;
}

export interface GridCell {
  x: number;
  y: number;
  value: number;
}

export interface BoundaryCoordinate {
  lng: number;
  lat: number;
}

export interface DistrictBounds {
  min_lng: number;
  max_lng: number;
  min_lat: number;
  max_lat: number;
  center_lng: number;
  center_lat: number;
}

export interface LayerData {
  district: string;
  state: string;
  month: string;
  boundary: GeoJSONFeature;
  ndvi_grid: GridCell[] | null;
  water_grid: GridCell[] | null;
  rainfall_grid: GridCell[] | null;
  terrain_heightmap: number[][] | null;
  bounds: DistrictBounds | null;
}

export interface GeoJSONFeature {
  type: string;
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

export type LayerType = 'boundary' | 'ndvi' | 'water' | 'rainfall';

export interface LayerVisibility {
  boundary: boolean;
  ndvi: boolean;
  water: boolean;
  rainfall: boolean;
}

// ─── Advanced Google Maps & GIS Types ─────────────────────────

export type ViewMode = 'globe' | '3d' | 'google-map' | 'split';

export type MapType = 'satellite' | 'hybrid' | 'terrain' | 'dark';

export type ActiveTool = 'none' | 'measure-distance' | 'measure-area' | 'probe';

export interface GroundStation {
  id: string;
  name: string;
  type: 'wetland' | 'river' | 'agricultural' | 'hydrology' | 'radar' | 'research';
  category: string;
  lat: number;
  lng: number;
  elevationM: number;
  ndvi: number;
  waterMetric: string;
  rainfallMm: number;
  temperatureC: number;
  status: 'optimal' | 'alert' | 'monitoring' | 'warning';
  description: string;
  groundTruthNote: string;
  sensorSpecs: string;
  panoramicUrl?: string;
}

export interface ProbeData {
  lat: number;
  lng: number;
  elevationM: number;
  ndvi: number;
  waterLikelihood: number;
  rainfallMm: number;
  locality: string;
}

export interface MeasurementPoint {
  lat: number;
  lng: number;
}

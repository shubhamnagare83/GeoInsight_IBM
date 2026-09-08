/**
 * GeoInsight API Service
 * Handles all communication with the FastAPI backend.
 * Falls back to demo data when the backend is unavailable.
 */
import axios, { type AxiosInstance } from 'axios';
import type { EnvironmentData, LayerData, GridCell } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Live API Calls ───────────────────────────────────────

export async function fetchEnvironmentData(
  district: string = 'kamrup',
  month: string = '2026-06'
): Promise<EnvironmentData> {
  const response = await apiClient.get('/api/v1/environment', {
    params: { district, month },
  });
  return response.data;
}

export async function fetchLayerData(
  district: string = 'kamrup',
  month: string = '2026-06',
  resolution: number = 64
): Promise<LayerData> {
  const response = await apiClient.get('/api/v1/layers', {
    params: { district, month, resolution },
  });
  return response.data;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health', { timeout: 3000 });
    return response.data?.status === 'healthy';
  } catch {
    return false;
  }
}

// ─── Demo Data ────────────────────────────────────────────

const MONTHLY_DEMO: Record<string, { ndvi: number; rainfall: number; waterPct: number }> = {
  '01': { ndvi: 0.42, rainfall: 12, waterPct: 2.8 },
  '02': { ndvi: 0.38, rainfall: 18, waterPct: 2.5 },
  '03': { ndvi: 0.35, rainfall: 48, waterPct: 2.6 },
  '04': { ndvi: 0.40, rainfall: 142, waterPct: 3.2 },
  '05': { ndvi: 0.48, rainfall: 258, waterPct: 3.8 },
  '06': { ndvi: 0.58, rainfall: 421, waterPct: 4.7 },
  '07': { ndvi: 0.65, rainfall: 385, waterPct: 8.5 },
  '08': { ndvi: 0.62, rainfall: 312, waterPct: 7.2 },
  '09': { ndvi: 0.55, rainfall: 225, waterPct: 5.8 },
  '10': { ndvi: 0.48, rainfall: 128, waterPct: 4.1 },
  '11': { ndvi: 0.45, rainfall: 32, waterPct: 3.4 },
  '12': { ndvi: 0.43, rainfall: 10, waterPct: 3.0 },
};

const KAMRUP_BOUNDARY_COORDS: number[][] = [
  [91.30, 26.35], [91.35, 26.40], [91.45, 26.42], [91.55, 26.40],
  [91.65, 26.42], [91.75, 26.38], [91.85, 26.35], [91.90, 26.30],
  [91.95, 26.22], [91.98, 26.15], [91.95, 26.08], [91.90, 26.02],
  [91.85, 25.98], [91.78, 25.95], [91.70, 25.93], [91.60, 25.92],
  [91.50, 25.93], [91.42, 25.96], [91.35, 26.00], [91.30, 26.05],
  [91.27, 26.12], [91.25, 26.20], [91.26, 26.28], [91.30, 26.35],
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDemoGrid(resolution: number, seed: number, baseFn: (x: number, y: number) => number): GridCell[] {
  const rng = seededRandom(seed);
  const cells: GridCell[] = [];
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x = j / (resolution - 1);
      const y = i / (resolution - 1);
      const value = Math.max(0, Math.min(1, baseFn(x, y) + (rng() - 0.5) * 0.1));
      cells.push({ x, y, value: parseFloat(value.toFixed(4)) });
    }
  }
  return cells;
}

function generateDemoHeightmap(resolution: number): number[][] {
  const heightmap: number[][] = [];
  for (let i = 0; i < resolution; i++) {
    const row: number[] = [];
    for (let j = 0; j < resolution; j++) {
      const x = j / resolution;
      const y = i / resolution;
      let h = 0;
      h += Math.sin(x * Math.PI * 2) * Math.cos(y * Math.PI * 2) * 0.04;
      h += Math.sin(x * Math.PI * 4 + 1) * Math.cos(y * Math.PI * 3 + 2) * 0.02;
      // River valley
      const riverDist = Math.abs(y - 0.5);
      if (riverDist < 0.1) {
        h *= riverDist / 0.1;
      }
      h = h * 0.5 + 0.05;
      row.push(parseFloat(Math.max(0.01, h).toFixed(4)));
    }
    heightmap.push(row);
  }
  return heightmap;
}

function generateDemoWaterGrid(resolution: number, coverage: number): GridCell[] {
  const cells: GridCell[] = [];
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x = j / (resolution - 1);
      const y = i / (resolution - 1);
      // River pattern
      const riverCenter = 0.5 + Math.sin(x * 4) * 0.06;
      const riverWidth = 0.04 + coverage * 0.005;
      const dist = Math.abs(y - riverCenter);
      if (dist < riverWidth) {
        const value = 1.0 - dist / riverWidth;
        cells.push({ x, y, value: parseFloat(value.toFixed(4)) });
      }
    }
  }
  return cells;
}

function generateInsight(district: string, month: string, ndvi: number, rainfall: number, waterPct: number): string {
  const monthNames: Record<string, string> = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December',
  };
  const parts = month.split('-');
  const year = parts[0];
  const mm = parts[1] || '06';
  const monthName = monthNames[mm] || 'June';

  const vegHealth = ndvi >= 0.6 ? 'strong vegetation health' : ndvi >= 0.4 ? 'moderate vegetation health' : 'below-average vegetation health';
  const rainDesc = rainfall >= 350 ? 'heavy monsoon rainfall' : rainfall >= 200 ? 'significant rainfall' : rainfall >= 100 ? 'moderate rainfall' : 'low rainfall';
  const waterDesc = waterPct >= 7 ? 'elevated surface water levels indicating potential flood risk' : waterPct >= 4 ? 'notable surface water presence consistent with monsoon conditions' : 'normal surface water levels';

  return `${district} recorded ${vegHealth} during ${monthName} ${year}, with an average NDVI of ${ndvi.toFixed(2)} and surface-water coverage of ${waterPct}%. The district experienced ${rainDesc} with a spatial mean of ${rainfall.toFixed(0)} mm, and ${waterDesc}. These conditions are consistent with the ${['06','07','08','09'].includes(mm) ? 'monsoon' : 'seasonal'} patterns observed across the Brahmaputra valley region.`;
}

export function getDemoEnvironmentData(month: string = '2026-06'): EnvironmentData {
  const mm = month.split('-')[1] || '06';
  const data = MONTHLY_DEMO[mm] || MONTHLY_DEMO['06'];
  const districtArea = 793.0;
  const waterArea = parseFloat((data.waterPct / 100 * districtArea).toFixed(1));

  return {
    district: 'Kamrup',
    state: 'Assam',
    month,
    vegetation: {
      average_ndvi: data.ndvi,
      min_ndvi: parseFloat((data.ndvi - 0.25).toFixed(2)),
      max_ndvi: parseFloat((data.ndvi + 0.20).toFixed(2)),
    },
    rainfall: {
      metric: 'spatial_mean',
      value_mm: data.rainfall,
    },
    surface_water: {
      coverage_percent: data.waterPct,
      area_km2: waterArea,
    },
    insight: generateInsight('Kamrup', month, data.ndvi, data.rainfall, data.waterPct),
  };
}

export function getDemoLayerData(month: string = '2026-06'): LayerData {
  const mm = month.split('-')[1] || '06';
  const data = MONTHLY_DEMO[mm] || MONTHLY_DEMO['06'];
  const resolution = 64;

  return {
    district: 'Kamrup',
    state: 'Assam',
    month,
    boundary: {
      type: 'Feature',
      properties: { district: 'Kamrup', state: 'Assam', country: 'India' },
      geometry: {
        type: 'Polygon',
        coordinates: [KAMRUP_BOUNDARY_COORDS],
      },
    },
    ndvi_grid: generateDemoGrid(resolution, parseInt(mm) * 1000, (x, y) => {
      let v = data.ndvi;
      v += Math.sin(x * Math.PI * 3) * Math.cos(y * Math.PI * 2) * 0.15;
      // River valley — lower NDVI
      const riverDist = Math.abs(y - 0.5 - Math.sin(x * 4) * 0.06);
      if (riverDist < 0.08) v *= riverDist / 0.08;
      return Math.max(-0.1, Math.min(0.9, v));
    }),
    water_grid: generateDemoWaterGrid(resolution, data.waterPct),
    rainfall_grid: generateDemoGrid(resolution, parseInt(mm) * 2000, (x, y) => {
      const base = 0.5 + Math.sin(x * Math.PI) * 0.2 + Math.cos(y * Math.PI * 0.5) * 0.15;
      return Math.max(0, Math.min(1, base));
    }),
    terrain_heightmap: generateDemoHeightmap(resolution),
    bounds: {
      min_lng: 91.25,
      max_lng: 91.98,
      min_lat: 25.92,
      max_lat: 26.42,
      center_lng: 91.615,
      center_lat: 26.17,
    },
  };
}

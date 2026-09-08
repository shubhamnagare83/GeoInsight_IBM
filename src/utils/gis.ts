import type { MeasurementPoint, ProbeData } from '../types/api';

/**
 * Calculates Haversine distance between two points on Earth in meters.
 */
export function calculateDistanceMeters(p1: MeasurementPoint, p2: MeasurementPoint): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate total path distance in meters.
 */
export function calculatePathDistance(points: MeasurementPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistanceMeters(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Calculates spherical polygon area in square meters.
 */
export function calculatePolygonAreaSqMeters(points: MeasurementPoint[]): number {
  if (points.length < 3) return 0;
  const R = 6378137; // WGS84 major radius
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const p1 = points[i];
    const p2 = points[j];

    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const lng1 = (p1.lng * Math.PI) / 180;
    const lng2 = (p2.lng * Math.PI) / 180;

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * R * R) / 2.0;
  return area;
}

/**
 * Sample environmental attributes for any probed coordinate inside Kamrup.
 */
export function sampleProbeData(lat: number, lng: number, baseNdvi = 0.58, baseRainfall = 421): ProbeData {
  // Center: ~26.17° N, 91.61° E
  const dLng = lng - 91.61;

  // Brahmaputra river latitude runs around 26.18 - 26.21
  const distToRiver = Math.abs(lat - (26.19 + Math.sin(lng * 8) * 0.02));
  const isRiver = distToRiver < 0.015;

  let localNdvi: number;
  let waterLikelihood: number;

  if (isRiver) {
    localNdvi = Number((0.08 + Math.random() * 0.08).toFixed(2));
    waterLikelihood = Number((90 + Math.random() * 8).toFixed(1));
  } else {
    // Foothills to the south have higher NDVI and elevation
    const isSouthHills = lat < 26.10;
    const isWetland = Math.abs(lat - 26.126) < 0.02 && Math.abs(lng - 91.654) < 0.02;

    if (isWetland) {
      localNdvi = Number((0.70 + Math.random() * 0.06).toFixed(2));
      waterLikelihood = Number((75 + Math.random() * 15).toFixed(1));
    } else if (isSouthHills) {
      localNdvi = Number((0.74 + Math.random() * 0.08).toFixed(2));
      waterLikelihood = Number((4 + Math.random() * 5).toFixed(1));
    } else {
      localNdvi = Number((baseNdvi + (Math.sin(dLng * 15) * 0.1) + (Math.random() * 0.06 - 0.03)).toFixed(2));
      waterLikelihood = Number((12 + Math.random() * 10).toFixed(1));
    }
  }

  // Elevation estimation: 45m along river to 350m in hills
  let elevationM = Math.round(50 + Math.max(0, (26.15 - lat) * 450) + Math.abs(dLng) * 80);
  if (isRiver) elevationM = 48;

  // Rainfall variation
  const rainfallMm = Math.round(baseRainfall + (26.2 - lat) * 60 + (lng - 91.5) * 30);

  // Locality classification
  let locality = 'Kamrup Alluvial Basin';
  if (lat > 26.35) locality = 'Rangia Rural Sub-Division';
  else if (lat < 26.08) locality = 'Mirza / South Kamrup Corridor';
  else if (lng > 91.70) locality = 'Guwahati Metropolitan Region';
  else if (lng < 91.45) locality = 'Boko Agricultural Plain';
  else if (distToRiver < 0.02) locality = 'Brahmaputra Riparian Zone';

  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    elevationM,
    ndvi: Math.max(-0.1, Math.min(0.95, localNdvi)),
    waterLikelihood,
    rainfallMm,
    locality,
  };
}

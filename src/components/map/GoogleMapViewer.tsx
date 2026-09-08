import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../../context/AppContext';
import { KAMRUP_STATIONS } from '../../data/groundStations';
import StationInfoWindow from './StationInfoWindow';
import MapToolsBar from './MapToolsBar';
import {
  calculatePathDistance,
  calculatePolygonAreaSqMeters,
  sampleProbeData,
} from '../../utils/gis';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function GoogleMapViewer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const overlaysLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const measurementsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const {
    layerData,
    layers,
    activeMapType,
    activeTool,
    setSelectedStation,
    probeResult,
    setProbeResult,
    measurementPoints,
    setMeasurementPoints,
    flyToTarget,
    setFlyToTarget,
    environmentData,
  } = useApp();

  // ─── 1. Initialize Leaflet Map ──────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered over Kamrup district
    const map = L.map(mapContainerRef.current, {
      center: [26.17, 91.615],
      zoom: 10,
      minZoom: 8,
      maxZoom: 18,
      zoomControl: false,
    });

    // Custom positioned zoom control on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add scale bar
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    // Layer groups
    const overlays = L.layerGroup().addTo(map);
    const stations = L.layerGroup().addTo(map);
    const measurements = L.layerGroup().addTo(map);

    overlaysLayerGroupRef.current = overlays;
    stationsLayerGroupRef.current = stations;
    measurementsLayerGroupRef.current = measurements;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ─── 2. Update Base Tile Layer based on activeMapType ────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let tileUrl = '';
    let attribution = '';
    let maxZoom = 20;

    switch (activeMapType) {
      case 'satellite':
        // Google Satellite Tiles (lyrs=s)
        tileUrl = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
        attribution = '&copy; Google Maps Satellite Imagery';
        break;
      case 'hybrid':
        // Google Hybrid Tiles (Satellite + Roads/Labels: lyrs=y)
        tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
        attribution = '&copy; Google Maps Hybrid Earth Observation';
        break;
      case 'terrain':
        // Google Terrain Tiles with elevation contours (lyrs=p)
        tileUrl = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
        attribution = '&copy; Google Maps Topography & Contours';
        break;
      case 'dark':
      default:
        // Tactical High-Contrast Dark Tiles for scientific visualization
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        attribution = '&copy; OpenStreetMap &copy; CARTO';
        maxZoom = 19;
        break;
    }

    const newTile = L.tileLayer(tileUrl, {
      attribution,
      maxZoom,
      subdomains: activeMapType === 'dark' ? 'abcd' : ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(map);

    baseTileLayerRef.current = newTile;
  }, [activeMapType]);

  // ─── 3. Fly-To Target Animation ─────────────────────────────
  useEffect(() => {
    if (!flyToTarget || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([flyToTarget.lat, flyToTarget.lng], flyToTarget.zoom, {
      duration: 1.8,
      easeLinearity: 0.25,
    });
    setFlyToTarget(null);
  }, [flyToTarget, setFlyToTarget]);

  // ─── 4. Render Kamrup Boundary & Raster Overlays ────────────
  useEffect(() => {
    const overlays = overlaysLayerGroupRef.current;
    if (!overlays) return;
    overlays.clearLayers();

    // Boundary Polygon
    if (layers.boundary && layerData?.boundary) {
      const geojsonLayer = L.geoJSON(layerData.boundary as any, {
        style: {
          color: '#00d4ff',
          weight: 2.5,
          opacity: 0.9,
          fillColor: '#00d4ff',
          fillOpacity: 0.08,
          dashArray: '4, 4',
        },
      });
      overlays.addLayer(geojsonLayer);
    }

    // NDVI Vegetation Grid Overlay
    if (layers.ndvi && layerData?.ndvi_grid) {
      // Create colored circles for NDVI visualization
      const ndviGroup = L.layerGroup();
      const minLng = 91.25;
      const maxLng = 91.98;
      const minLat = 25.92;
      const maxLat = 26.42;

      // Sample a subset for smooth performance
      layerData.ndvi_grid
        .filter((_, idx) => idx % 2 === 0)
        .forEach((cell) => {
          const lat = minLat + cell.y * (maxLat - minLat);
          const lng = minLng + cell.x * (maxLng - minLng);

          let color = '#2eb82e';
          if (cell.value < 0.25) color = '#a07a28';
          else if (cell.value < 0.5) color = '#c8c828';
          else if (cell.value > 0.7) color = '#0f691e';

          const circle = L.circle([lat, lng], {
            radius: 450,
            color: 'transparent',
            fillColor: color,
            fillOpacity: 0.35,
          });
          ndviGroup.addLayer(circle);
        });

      overlays.addLayer(ndviGroup);
    }

    // Surface Water Brahmaputra Overlay
    if (layers.water) {
      // Add the Brahmaputra River channel polygon
      const riverCoords: [number, number][] = [
        [26.15, 91.30], [26.18, 91.40], [26.21, 91.52], [26.19, 91.65],
        [26.19, 91.75], [26.24, 91.85], [26.26, 91.95],
        [26.22, 91.95], [26.17, 91.85], [26.16, 91.75], [26.15, 91.65],
        [26.17, 91.52], [26.14, 91.40], [26.12, 91.30],
      ];
      const riverPoly = L.polygon(riverCoords, {
        color: '#00e5ff',
        weight: 1.5,
        fillColor: '#00b4d8',
        fillOpacity: 0.5,
      });
      overlays.addLayer(riverPoly);
    }

    // Rainfall Heatmap Overlay
    if (layers.rainfall) {
      const rainCoords: [number, number][] = [
        [26.35, 91.30], [26.42, 91.65], [26.35, 91.95],
        [25.95, 91.90], [25.92, 91.50], [26.05, 91.27],
      ];
      const rainPoly = L.polygon(rainCoords, {
        color: '#9c27b0',
        weight: 1,
        fillColor: '#7b1fa2',
        fillOpacity: 0.22,
      });
      overlays.addLayer(rainPoly);
    }
  }, [layerData, layers]);

  // ─── 5. Render Environmental Ground Stations ────────────────
  useEffect(() => {
    const stations = stationsLayerGroupRef.current;
    if (!stations) return;
    stations.clearLayers();

    KAMRUP_STATIONS.forEach((st) => {
      // Custom pulsing radar SVG icon
      const statusColor =
        st.status === 'optimal'
          ? '#00e676'
          : st.status === 'monitoring'
          ? '#00d4ff'
          : '#ffab00';

      const customIcon = L.divIcon({
        className: 'custom-radar-icon',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: ${statusColor}; opacity: 0.25; animation: pulse 2s infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: ${statusColor}; border: 2px solid white; box-shadow: 0 0 10px ${statusColor};"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedStation(st);
      });

      // Quick hover tooltip
      marker.bindTooltip(
        `<div style="font-family: Inter, sans-serif; font-size: 11px; font-weight: 600; color: #0a0e17; padding: 2px 4px;">
          ${st.name} <br/>
          <span style="font-size: 10px; color: #0088aa;">NDVI: ${st.ndvi} • Elev: ${st.elevationM}m</span>
        </div>`,
        { direction: 'top', offset: [0, -10], opacity: 0.95 }
      );

      stations.addLayer(marker);
    });
  }, [setSelectedStation]);

  // ─── 6. Handle Interactive Tools (Distance, Area, Probe) ────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    function handleMapClick(e: L.LeafletMouseEvent) {
      const { lat, lng } = e.latlng;

      if (activeTool === 'measure-distance' || activeTool === 'measure-area') {
        setMeasurementPoints((prev) => [...prev, { lat, lng }]);
      } else if (activeTool === 'probe') {
        const baseNdvi = environmentData?.vegetation.average_ndvi || 0.58;
        const baseRain = environmentData?.rainfall.value_mm || 421;
        const data = sampleProbeData(lat, lng, baseNdvi, baseRain);
        setProbeResult(data);
      }
    }

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [activeTool, setMeasurementPoints, setProbeResult, environmentData]);

  // ─── 7. Render Measurements (Lines & Polygons) ──────────────
  const { pathDistanceKm, areaSqKm } = useMemo(() => {
    const dist = (calculatePathDistance(measurementPoints) / 1000).toFixed(2);
    const area = (calculatePolygonAreaSqMeters(measurementPoints) / 1000000).toFixed(2);
    return { pathDistanceKm: dist, areaSqKm: area };
  }, [measurementPoints]);

  useEffect(() => {
    const measurements = measurementsLayerGroupRef.current;
    if (!measurements) return;
    measurements.clearLayers();

    if (measurementPoints.length === 0) return;

    const latlngs: [number, number][] = measurementPoints.map((p) => [p.lat, p.lng]);

    // Markers on each measurement vertex
    measurementPoints.forEach((pt) => {
      const circle = L.circleMarker([pt.lat, pt.lng], {
        radius: 5,
        color: '#00e676',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2,
      });
      measurements.addLayer(circle);
    });

    if (activeTool === 'measure-distance' && measurementPoints.length >= 2) {
      const polyline = L.polyline(latlngs, {
        color: '#00e676',
        weight: 3,
        dashArray: '6, 6',
      });
      measurements.addLayer(polyline);
    } else if (activeTool === 'measure-area' && measurementPoints.length >= 3) {
      const polygon = L.polygon(latlngs, {
        color: '#2196f3',
        weight: 2,
        fillColor: '#2196f3',
        fillOpacity: 0.25,
      });
      measurements.addLayer(polygon);
    }
  }, [measurementPoints, activeTool]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-geo-darker">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Tools & MapType Switcher */}
      <MapToolsBar />

      {/* Station Details InfoWindow */}
      <StationInfoWindow />

      {/* Active Measurement HUD Banner */}
      {(measurementPoints.length > 0 || probeResult) && (
        <div className="absolute top-16 left-4 z-20 glass-panel-solid px-4 py-2.5 border border-geo-cyan/40 shadow-xl animate-fade-in max-w-sm">
          {activeTool === 'measure-distance' && (
            <div>
              <p className="text-[0.65rem] font-bold text-geo-green uppercase tracking-wider font-mono">
                DISTANCE MEASUREMENT
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-white font-mono">{pathDistanceKm}</span>
                <span className="text-xs text-geo-text-muted">kilometers</span>
              </div>
              <p className="text-[0.6rem] text-geo-text-muted mt-1">
                Points: {measurementPoints.length} • Click map to add vertices
              </p>
            </div>
          )}

          {activeTool === 'measure-area' && (
            <div>
              <p className="text-[0.65rem] font-bold text-geo-blue uppercase tracking-wider font-mono">
                POLYGON AREA MEASUREMENT
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-white font-mono">{areaSqKm}</span>
                <span className="text-xs text-geo-text-muted">km²</span>
                <span className="text-xs text-geo-cyan font-mono">
                  ({(parseFloat(areaSqKm) * 100).toFixed(0)} ha)
                </span>
              </div>
              <p className="text-[0.6rem] text-geo-text-muted mt-1">
                Vertices: {measurementPoints.length} • Click 3+ points to close polygon
              </p>
            </div>
          )}

          {probeResult && activeTool === 'probe' && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[0.65rem] font-bold text-geo-cyan uppercase tracking-wider font-mono">
                  COORDINATE PROBE INSPECTOR
                </span>
                <span className="text-[0.6rem] text-geo-text-muted font-mono">
                  {probeResult.lat}°N, {probeResult.lng}°E
                </span>
              </div>
              <p className="text-xs font-semibold text-white mb-2">{probeResult.locality}</p>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded bg-geo-darker/80 border border-geo-border text-center font-mono">
                <div>
                  <p className="text-[0.55rem] text-geo-text-muted">NDVI</p>
                  <p className="text-xs font-bold text-geo-green">{probeResult.ndvi}</p>
                </div>
                <div>
                  <p className="text-[0.55rem] text-geo-text-muted">ELEVATION</p>
                  <p className="text-xs font-bold text-geo-cyan">{probeResult.elevationM}m</p>
                </div>
                <div>
                  <p className="text-[0.55rem] text-geo-text-muted">WATER PROB</p>
                  <p className="text-xs font-bold text-sky-400">{probeResult.waterLikelihood}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Attribution Watermark */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none text-[0.6rem] font-mono text-geo-text-muted/60 glass-panel px-2 py-0.5">
        KAMRUP GIS • GOOGLE SATELLITE ENGINE • WGS84
      </div>
    </div>
  );
}

# GeoInsight — Geospatial Intelligence for Kamrup, Assam

A production-quality 3D environmental intelligence command center and hackathon prototype that transforms satellite, rainfall, and surface-water geospatial data into an interactive 3D digital twin dashboard.

---

## 🛰️ Architecture & Data Pipeline

The application implements a full-stack geospatial processing and visualization pipeline:

```
                          ┌───────────────────────────┐
                          │        USER INPUT         │
                          │  District + Target Month  │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │     DISTRICT BOUNDARY     │
                          │  geoBoundaries / GeoJSON  │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│  Copernicus Sentinel-2│   │     CHIRPS v2.0       │   │  JRC Global Surface   │
│   B4 (Red) + B8 (NIR) │   │ Precipitation Climate │   │         Water         │
└──────────┬────────────┘   └───────────┬───────────┘   └───────────┬───────────┘
           │                            │                           │
           ▼                            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│  SPATIAL CLIPPING     │   │  SPATIAL CLIPPING     │   │  SPATIAL CLIPPING     │
│   & Polygon Masking   │   │   & Polygon Masking   │   │   & Polygon Masking   │
└──────────┬────────────┘   └───────────┬───────────┘   └───────────┬───────────┘
           │                            │                           │
           ▼                            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│       NDVI CALC       │   │  SPATIAL MEAN RAIN    │   │  WATER COVERAGE %     │
│ (B8 - B4) / (B8 + B4) │   │   Mean rainfall (mm)  │   │  Water Area / Total   │
└──────────┬────────────┘   └───────────┬───────────┘   └───────────┬───────────┘
           │                            │                           │
           └────────────────────────────┼───────────────────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │     STANDARDIZED JSON     │
                          │  Pydantic Validated DTO   │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │      FASTAPI REST API     │
                          │  /api/v1/environment      │
                          │  /api/v1/layers           │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │    3D WEB APPLICATION     │
                          │ React + Three.js + R3F    │
                          │ OrbitControls + HUD + GIS │
                          └───────────────────────────┘
```

---

## ⚡ Core Features

- **Interactive 3D Digital Twin**:
  - Three.js / React Three Fiber interactive terrain with heightmap displacement representing the topography of Kamrup and the Brahmaputra river valley.
  - OrbitControls: Left-click to rotate, scroll to zoom, right-click to pan.
  - Cinematic satellite camera fly-in upon initial load and analysis execution.
  - Orbital coordinate rings and atmospheric particle telemetry.
- **District Boundary Visualization**:
  - Elevated glowing 3D vector outline of Kamrup district with vertical coordinate beacon markers and pulsing illumination.
- **NDVI Vegetation Analysis**:
  - Accurate raster color gradient: brown/yellow (low vegetation) → yellow/green (moderate) → lush dark emerald green (high vegetation).
  - Calculated according to standard Normalized Difference Vegetation Index formula using Sentinel-2 B4 and B8 bands.
  - Interactive legend with graded scale from `-1.0` to `1.0`.
- **Surface-Water Layer**:
  - Cyan-blue translucent water regions with emissive glow and dynamic animated surface movement.
  - Highlights water occurrence across the Brahmaputra River network and seasonal floodplains.
  - Metrics: Water coverage percentage (`4.7%`) and water surface area (`37.2 km²`).
- **Rainfall Layer (CHIRPS)**:
  - Semi-transparent precipitation intensity heatmap with additive blending.
  - Labeled explicitly as "Average spatial rainfall" in millimeters (`mm`).
- **AI Environmental Insight**:
  - Automated environmental diagnosis summarizing vegetation health, precipitation levels, and hydrological risks based directly on calculated sensor metrics.
- **Command Center HUD & Diagnostics**:
  - Live satellite telemetry readout: Latitude, Longitude, Orbital Altitude (786 km LEO), and active sensor feeds.
  - Intelligent step-by-step geospatial processing loading overlay.
- **Hackathon Demo Mode**:
  - Integrated resilient fallback: smoothly operates in live API mode or standalone DEMO mode with realistic seasonal environmental data for Kamrup.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **3D Engine**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Styling**: Tailwind CSS v3, Glassmorphism, Custom Design System
- **Icons**: Lucide React
- **Data Visualizations**: Recharts
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI + Uvicorn
- **Geospatial Processing**: GeoPandas, Rasterio, NumPy, Shapely
- **Validation**: Pydantic v2
- **Data Sources**: Copernicus Sentinel-2, CHIRPS v2.0, JRC Global Surface Water, geoBoundaries

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) and npm
- Python (3.10+) and pip

### 1. Frontend Setup & Launch

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Backend Setup & Launch (Optional for Live API)

```bash
# Navigate to backend directory
cd backend

# Install Python requirements
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The API will be available at [http://localhost:8000](http://localhost:8000) with interactive Swagger documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 📡 REST API Specifications

### 1. Environmental Summary Metric
- **Endpoint**: `GET /api/v1/environment`
- **Query Params**:
  - `district` (default: `kamrup`)
  - `month` (format: `YYYY-MM`, default: `2026-06`)
- **Sample Response**:
```json
{
  "district": "Kamrup",
  "state": "Assam",
  "month": "2026-06",
  "vegetation": {
    "average_ndvi": 0.58,
    "min_ndvi": 0.33,
    "max_ndvi": 0.78
  },
  "rainfall": {
    "metric": "spatial_mean",
    "value_mm": 421.0
  },
  "surface_water": {
    "coverage_percent": 4.7,
    "area_km2": 37.2
  },
  "insight": "Kamrup recorded moderate vegetation health during June 2026, with an average NDVI of 0.58 and surface-water coverage of 4.7%..."
}
```

### 2. Geospatial Layer Data
- **Endpoint**: `GET /api/v1/layers`
- **Query Params**:
  - `district` (default: `kamrup`)
  - `month` (format: `YYYY-MM`, default: `2026-06`)
  - `resolution` (default: `64`, range: `16-128`)
- **Returns**: Preprocessed downsampled grids for NDVI, water occurrence, rainfall, terrain heightmap, and GeoJSON boundary.

---

## 🗺️ Visual Theme & Aesthetics

- **Command Center Design**: High-contrast, dark mode interface (`#060a12`) designed to emulate mission-critical scientific and earth observation platforms.
- **Glassmorphism**: Translucent panels with background blurs, subtle cyan/emerald borders, and glowing interactive elements.
- **Precision Typography**: Inter for crisp interface legibility and JetBrains Mono for telemetry readouts.

"""
Geospatial service — district boundary loading, clipping, and coordinate transformations.
"""
import json
import os
import numpy as np
from pathlib import Path
from typing import Optional, Tuple

# Kamrup district approximate boundary (simplified polygon)
# Centroid: ~26.17°N, 91.67°E
KAMRUP_BOUNDARY_GEOJSON = {
    "type": "Feature",
    "properties": {
        "district": "Kamrup",
        "state": "Assam",
        "country": "India"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [91.30, 26.35],
            [91.35, 26.40],
            [91.45, 26.42],
            [91.55, 26.40],
            [91.65, 26.42],
            [91.75, 26.38],
            [91.85, 26.35],
            [91.90, 26.30],
            [91.95, 26.22],
            [91.98, 26.15],
            [91.95, 26.08],
            [91.90, 26.02],
            [91.85, 25.98],
            [91.78, 25.95],
            [91.70, 25.93],
            [91.60, 25.92],
            [91.50, 25.93],
            [91.42, 25.96],
            [91.35, 26.00],
            [91.30, 26.05],
            [91.27, 26.12],
            [91.25, 26.20],
            [91.26, 26.28],
            [91.30, 26.35],
        ]]
    }
}

KAMRUP_BOUNDS = {
    "min_lng": 91.25,
    "max_lng": 91.98,
    "min_lat": 25.92,
    "max_lat": 26.42,
    "center_lng": 91.615,
    "center_lat": 26.17,
}

# Approximate district area in km²
KAMRUP_AREA_KM2 = 793.0


def get_district_boundary(district: str = "kamrup") -> dict:
    """
    Load district boundary GeoJSON.
    
    In production, this would load from a geoBoundaries shapefile/GeoJSON.
    Currently returns the embedded Kamrup boundary.
    """
    data_dir = Path(__file__).parent.parent / "data"
    boundary_file = data_dir / f"{district}_boundary.geojson"
    
    if boundary_file.exists():
        with open(boundary_file, "r") as f:
            return json.load(f)
    
    # Fallback to embedded boundary
    if district.lower() == "kamrup":
        return KAMRUP_BOUNDARY_GEOJSON
    
    raise ValueError(f"Boundary data not available for district: {district}")


def get_district_bounds(district: str = "kamrup") -> dict:
    """Get bounding box for the district."""
    if district.lower() == "kamrup":
        return KAMRUP_BOUNDS
    raise ValueError(f"Bounds not available for district: {district}")


def get_district_area_km2(district: str = "kamrup") -> float:
    """Get district area in km²."""
    if district.lower() == "kamrup":
        return KAMRUP_AREA_KM2
    raise ValueError(f"Area not available for district: {district}")


def generate_terrain_heightmap(
    bounds: dict,
    resolution: int = 64
) -> list:
    """
    Generate a terrain heightmap for visualization.
    
    In production, this would use SRTM/ASTER DEM data.
    Currently generates realistic-looking procedural terrain.
    """
    np.random.seed(42)
    
    # Create base terrain using multiple octaves of noise
    heightmap = np.zeros((resolution, resolution))
    
    for octave in range(4):
        freq = 2 ** octave
        amplitude = 1.0 / (octave + 1)
        
        x = np.linspace(0, freq * np.pi, resolution)
        y = np.linspace(0, freq * np.pi, resolution)
        xx, yy = np.meshgrid(x, y)
        
        noise = np.sin(xx + np.random.random() * 10) * np.cos(yy + np.random.random() * 10)
        heightmap += noise * amplitude
    
    # Normalize to 0-1 range
    heightmap = (heightmap - heightmap.min()) / (heightmap.max() - heightmap.min())
    
    # Add river valley (Brahmaputra flows through Kamrup)
    river_y = resolution // 2
    for i in range(resolution):
        valley_width = int(5 + 3 * np.sin(i * 0.1))
        for j in range(max(0, river_y - valley_width), min(resolution, river_y + valley_width)):
            distance = abs(j - river_y) / valley_width
            heightmap[j, i] *= 0.3 + 0.7 * distance
    
    # Scale heights (Kamrup has gentle terrain, 50-200m elevation range)
    heightmap = heightmap * 0.15 + 0.02
    
    return heightmap.tolist()

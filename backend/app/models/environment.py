"""
Pydantic models for GeoInsight API responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List


class VegetationData(BaseModel):
    """NDVI vegetation analysis results."""
    average_ndvi: float = Field(..., description="Average NDVI value for the district")
    min_ndvi: Optional[float] = Field(None, description="Minimum NDVI value")
    max_ndvi: Optional[float] = Field(None, description="Maximum NDVI value")


class RainfallData(BaseModel):
    """Rainfall analysis results."""
    metric: str = Field(default="spatial_mean", description="Rainfall metric type")
    value_mm: float = Field(..., description="Rainfall value in millimeters")


class SurfaceWaterData(BaseModel):
    """Surface water analysis results."""
    coverage_percent: float = Field(..., description="Water coverage as percentage of district area")
    area_km2: float = Field(..., description="Water surface area in square kilometers")


class EnvironmentResponse(BaseModel):
    """Complete environmental analysis response."""
    district: str
    state: str
    month: str
    vegetation: VegetationData
    rainfall: RainfallData
    surface_water: SurfaceWaterData
    insight: Optional[str] = Field(None, description="AI-generated environmental insight")


class GridCell(BaseModel):
    """Single grid cell for visualization data."""
    x: float
    y: float
    value: float


class BoundaryCoordinate(BaseModel):
    """A coordinate pair for boundary polygons."""
    lng: float
    lat: float


class LayerData(BaseModel):
    """Preprocessed geospatial layer data for frontend visualization."""
    district: str
    state: str
    month: str
    boundary: dict = Field(..., description="GeoJSON boundary of the district")
    ndvi_grid: Optional[List[GridCell]] = Field(None, description="Downsampled NDVI grid")
    water_grid: Optional[List[GridCell]] = Field(None, description="Downsampled water occurrence grid")
    rainfall_grid: Optional[List[GridCell]] = Field(None, description="Downsampled rainfall grid")
    terrain_heightmap: Optional[List[List[float]]] = Field(None, description="Terrain elevation grid")
    bounds: Optional[dict] = Field(None, description="Bounding box of the district")

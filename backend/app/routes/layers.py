"""
Layers API route — returns preprocessed geospatial visualization data.
"""
from fastapi import APIRouter, HTTPException, Query
from app.models.environment import LayerData
from app.services.geospatial import get_district_boundary, get_district_bounds, generate_terrain_heightmap
from app.services.ndvi import calculate_ndvi, generate_ndvi_grid
from app.services.rainfall import generate_rainfall_grid, calculate_rainfall
from app.services.water import generate_water_grid, calculate_water_coverage

router = APIRouter()


@router.get("/layers", response_model=LayerData)
async def get_layer_data(
    district: str = Query(default="kamrup", description="District name"),
    month: str = Query(default="2026-06", description="Month in YYYY-MM format"),
    resolution: int = Query(default=64, ge=16, le=128, description="Grid resolution"),
):
    """
    Get preprocessed geospatial layer data for 3D visualization.
    
    Returns district boundary, NDVI grid, water grid, rainfall grid,
    and terrain heightmap — all downsampled for browser consumption.
    """
    try:
        boundary = get_district_boundary(district)
        bounds = get_district_bounds(district)
        
        # Get metrics for grid generation
        ndvi_data = calculate_ndvi(month=month)
        rainfall_data = calculate_rainfall(month=month)
        water_data = calculate_water_coverage(month=month)
        
        # Generate visualization grids
        ndvi_grid = generate_ndvi_grid(
            resolution=resolution,
            average_ndvi=ndvi_data["average_ndvi"],
            month=month,
        )
        
        water_grid = generate_water_grid(
            resolution=resolution,
            coverage_percent=water_data["coverage_percent"],
            month=month,
        )
        
        rainfall_grid = generate_rainfall_grid(
            resolution=resolution,
            mean_rainfall_mm=rainfall_data["value_mm"],
            month=month,
        )
        
        terrain = generate_terrain_heightmap(bounds, resolution=resolution)
        
        return LayerData(
            district=district.capitalize(),
            state="Assam",
            month=month,
            boundary=boundary,
            ndvi_grid=ndvi_grid,
            water_grid=water_grid,
            rainfall_grid=rainfall_grid,
            terrain_heightmap=terrain,
            bounds=bounds,
        )
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Layer generation failed: {str(e)}")

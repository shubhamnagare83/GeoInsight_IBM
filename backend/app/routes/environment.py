"""
Environment API route — returns aggregated environmental metrics.
"""
from fastapi import APIRouter, HTTPException, Query
from app.models.environment import EnvironmentResponse, VegetationData, RainfallData, SurfaceWaterData
from app.services.ndvi import calculate_ndvi
from app.services.rainfall import calculate_rainfall
from app.services.water import calculate_water_coverage
from app.services.geospatial import get_district_area_km2

router = APIRouter()


def generate_insight(district: str, month: str, ndvi: float, rainfall: float, water_pct: float) -> str:
    """
    Generate an environmental insight summary.
    In production, this could call an LLM API for richer analysis.
    """
    month_names = {
        "01": "January", "02": "February", "03": "March", "04": "April",
        "05": "May", "06": "June", "07": "July", "08": "August",
        "09": "September", "10": "October", "11": "November", "12": "December",
    }
    
    month_num = month.split("-")[1] if "-" in month else "06"
    year = month.split("-")[0] if "-" in month else "2026"
    month_name = month_names.get(month_num, "June")
    
    # Vegetation health assessment
    if ndvi >= 0.6:
        veg_health = "strong vegetation health"
    elif ndvi >= 0.4:
        veg_health = "moderate vegetation health"
    elif ndvi >= 0.2:
        veg_health = "below-average vegetation health"
    else:
        veg_health = "poor vegetation health"
    
    # Rainfall assessment
    if rainfall >= 350:
        rain_desc = "heavy monsoon rainfall"
    elif rainfall >= 200:
        rain_desc = "significant rainfall"
    elif rainfall >= 100:
        rain_desc = "moderate rainfall"
    else:
        rain_desc = "low rainfall"
    
    # Water assessment
    if water_pct >= 7:
        water_desc = "elevated surface water levels indicating potential flood risk"
    elif water_pct >= 4:
        water_desc = "notable surface water presence consistent with monsoon conditions"
    else:
        water_desc = "normal surface water levels"
    
    insight = (
        f"{district} recorded {veg_health} during {month_name} {year}, "
        f"with an average NDVI of {ndvi:.2f} and surface-water coverage of {water_pct}%. "
        f"The district experienced {rain_desc} with a spatial mean of {rainfall:.0f} mm, "
        f"and {water_desc}. "
        f"These conditions are consistent with the {'monsoon' if month_num in ['06','07','08','09'] else 'seasonal'} "
        f"patterns observed across the Brahmaputra valley region."
    )
    
    return insight


@router.get("/environment", response_model=EnvironmentResponse)
async def get_environment_data(
    district: str = Query(default="kamrup", description="District name"),
    month: str = Query(default="2026-06", description="Month in YYYY-MM format"),
):
    """
    Get aggregated environmental analysis for a district.
    
    Returns NDVI, rainfall, and surface water metrics.
    """
    try:
        district_area = get_district_area_km2(district)
        
        # Calculate metrics
        ndvi_data = calculate_ndvi(month=month)
        rainfall_data = calculate_rainfall(month=month)
        water_data = calculate_water_coverage(
            district_area_km2=district_area,
            month=month,
        )
        
        # Generate insight
        insight = generate_insight(
            district=district.capitalize(),
            month=month,
            ndvi=ndvi_data["average_ndvi"],
            rainfall=rainfall_data["value_mm"],
            water_pct=water_data["coverage_percent"],
        )
        
        return EnvironmentResponse(
            district=district.capitalize(),
            state="Assam",
            month=month,
            vegetation=VegetationData(**ndvi_data),
            rainfall=RainfallData(**rainfall_data),
            surface_water=SurfaceWaterData(**water_data),
            insight=insight,
        )
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

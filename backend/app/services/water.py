"""
Surface water calculation service.

Uses JRC Global Surface Water dataset for water occurrence analysis.

Coverage: coverage_percent = water_area / district_area × 100
"""
import numpy as np
from typing import Optional, Dict, List


def calculate_water_coverage(
    water_raster: Optional[np.ndarray] = None,
    district_mask: Optional[np.ndarray] = None,
    district_area_km2: float = 793.0,
    month: str = "2026-06",
) -> Dict:
    """
    Calculate surface water coverage from JRC Global Surface Water data.
    
    Args:
        water_raster: JRC water occurrence raster (0-100 scale)
        district_mask: Boolean mask for the district boundary
        district_area_km2: Total district area in km²
        month: Analysis month in YYYY-MM format
    
    Returns:
        Dictionary with water coverage statistics
    """
    if water_raster is not None:
        # Real calculation
        if district_mask is not None:
            masked = water_raster[district_mask]
        else:
            masked = water_raster.flatten()
        
        # JRC water occurrence > 50 means water present
        water_pixels = np.sum(masked > 50)
        total_pixels = len(masked)
        
        coverage_percent = (water_pixels / total_pixels) * 100
        water_area_km2 = (coverage_percent / 100) * district_area_km2
        
        return {
            "coverage_percent": round(float(coverage_percent), 2),
            "area_km2": round(float(water_area_km2), 2),
        }
    
    # Demo data
    return _get_demo_water(month, district_area_km2)


def _get_demo_water(month: str, district_area_km2: float = 793.0) -> Dict:
    """Generate realistic demo water coverage based on season."""
    # Monthly surface water coverage for Kamrup (%)
    # Brahmaputra river system causes significant seasonal flooding
    monthly_water = {
        "01": 2.8,   # January - low water
        "02": 2.5,   # February - lowest
        "03": 2.6,   # March
        "04": 3.2,   # April - pre-monsoon rise
        "05": 3.8,   # May
        "06": 4.7,   # June - monsoon flooding begins
        "07": 8.5,   # July - peak flooding
        "08": 7.2,   # August - high water
        "09": 5.8,   # September
        "10": 4.1,   # October - receding
        "11": 3.4,   # November
        "12": 3.0,   # December
    }
    
    month_num = month.split("-")[1] if "-" in month else "06"
    coverage = monthly_water.get(month_num, 4.7)
    area = round(coverage / 100 * district_area_km2, 1)
    
    return {
        "coverage_percent": coverage,
        "area_km2": area,
    }


def generate_water_grid(
    resolution: int = 64,
    coverage_percent: float = 4.7,
    month: str = "2026-06",
) -> List[Dict]:
    """
    Generate a downsampled water occurrence grid for frontend visualization.
    
    In production, this would downsample the actual JRC raster.
    """
    np.random.seed(hash(month + "water") % 2**31)
    
    grid = np.zeros((resolution, resolution))
    
    # Brahmaputra river — runs roughly east-west through Kamrup
    river_y = resolution // 2
    
    for i in range(resolution):
        # Main river channel with meanders
        river_center = river_y + int(4 * np.sin(i * 0.2))
        river_width = int(3 + 2 * np.sin(i * 0.15))
        
        for j in range(max(0, river_center - river_width), min(resolution, river_center + river_width)):
            distance = abs(j - river_center) / max(river_width, 1)
            grid[j, i] = max(grid[j, i], 1.0 - distance * 0.5)
    
    # Add some tributaries
    for t in range(3):
        trib_x = int(resolution * (0.2 + t * 0.3))
        for k in range(river_y - 10, river_y):
            if 0 <= k < resolution and 0 <= trib_x < resolution:
                width = max(1, int(2 * (1 - abs(k - river_y + 5) / 10)))
                for w in range(max(0, trib_x - width), min(resolution, trib_x + width)):
                    grid[k, w] = max(grid[k, w], 0.6)
    
    # Add some seasonal flooding near the river during monsoon
    if coverage_percent > 4.0:
        flood_extent = int(coverage_percent * 0.8)
        for i in range(resolution):
            river_center = river_y + int(4 * np.sin(i * 0.2))
            for j in range(max(0, river_center - flood_extent - 5), min(resolution, river_center + flood_extent + 5)):
                distance = abs(j - river_center) / max(flood_extent + 5, 1)
                if distance < 1.0:
                    grid[j, i] = max(grid[j, i], (1.0 - distance) * 0.4)
    
    # Apply threshold
    grid = np.where(grid > 0.2, grid, 0)
    
    cells = []
    for i in range(resolution):
        for j in range(resolution):
            if grid[i, j] > 0:
                cells.append({
                    "x": j / (resolution - 1),
                    "y": i / (resolution - 1),
                    "value": round(float(grid[i, j]), 4),
                })
    
    return cells

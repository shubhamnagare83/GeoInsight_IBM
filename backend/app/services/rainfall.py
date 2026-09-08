"""
Rainfall calculation service.

Uses CHIRPS (Climate Hazards Group InfraRed Precipitation with Station data)
for spatial rainfall estimation.

The spatial mean is calculated over the district boundary.
"""
import numpy as np
from typing import Optional, Dict, List


def calculate_rainfall(
    rainfall_raster: Optional[np.ndarray] = None,
    district_mask: Optional[np.ndarray] = None,
    month: str = "2026-06",
) -> Dict:
    """
    Calculate spatial mean rainfall from CHIRPS data.
    
    Args:
        rainfall_raster: CHIRPS rainfall raster array (mm)
        district_mask: Boolean mask for the district boundary
        month: Analysis month in YYYY-MM format
    
    Returns:
        Dictionary with rainfall statistics
    """
    if rainfall_raster is not None:
        # Real calculation
        if district_mask is not None:
            masked = rainfall_raster[district_mask]
        else:
            masked = rainfall_raster.flatten()
        
        valid = masked[~np.isnan(masked)]
        
        return {
            "metric": "spatial_mean",
            "value_mm": float(np.mean(valid)),
        }
    
    # Demo data: realistic rainfall for Kamrup
    return _get_demo_rainfall(month)


def _get_demo_rainfall(month: str) -> Dict:
    """Generate realistic demo rainfall based on season."""
    # Monthly rainfall for Kamrup district (mm)
    # Assam receives heavy monsoon rainfall
    monthly_rainfall = {
        "01": 12,    # January - dry
        "02": 18,    # February - dry
        "03": 48,    # March - pre-monsoon
        "04": 142,   # April - pre-monsoon showers
        "05": 258,   # May - pre-monsoon
        "06": 421,   # June - monsoon onset
        "07": 385,   # July - peak monsoon
        "08": 312,   # August - monsoon
        "09": 225,   # September - retreating
        "10": 128,   # October - post-monsoon
        "11": 32,    # November - dry
        "12": 10,    # December - dry
    }
    
    month_num = month.split("-")[1] if "-" in month else "06"
    value = monthly_rainfall.get(month_num, 421)
    
    return {
        "metric": "spatial_mean",
        "value_mm": value,
    }


def generate_rainfall_grid(
    resolution: int = 64,
    mean_rainfall_mm: float = 421,
    month: str = "2026-06",
) -> List[Dict]:
    """
    Generate a downsampled rainfall grid for frontend visualization.
    
    In production, this would downsample the actual CHIRPS raster.
    """
    np.random.seed(hash(month + "rain") % 2**31)
    
    grid = np.zeros((resolution, resolution))
    
    # Rainfall spatial pattern — generally higher in NE, lower in SW
    x = np.linspace(0, np.pi, resolution)
    y = np.linspace(0, np.pi, resolution)
    xx, yy = np.meshgrid(x, y)
    
    # Base pattern
    grid = mean_rainfall_mm * (0.7 + 0.3 * np.sin(xx) * np.cos(yy * 0.5))
    
    # Add some noise
    grid += np.random.normal(0, mean_rainfall_mm * 0.1, (resolution, resolution))
    grid = np.clip(grid, 0, mean_rainfall_mm * 1.5)
    
    # Normalize to 0-1 for visualization
    grid_normalized = (grid - grid.min()) / (grid.max() - grid.min() + 1e-8)
    
    cells = []
    for i in range(resolution):
        for j in range(resolution):
            cells.append({
                "x": j / (resolution - 1),
                "y": i / (resolution - 1),
                "value": round(float(grid_normalized[i, j]), 4),
            })
    
    return cells

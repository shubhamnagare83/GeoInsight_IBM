"""
NDVI calculation service.

NDVI = (NIR - RED) / (NIR + RED)

For Sentinel-2:
  B8 = NIR (842nm)
  B4 = Red (665nm)

In production, this clips Sentinel-2 rasters to the district boundary
and calculates the spatial mean NDVI.
"""
import numpy as np
from typing import Optional, List, Dict


def calculate_ndvi(
    nir_band: Optional[np.ndarray] = None,
    red_band: Optional[np.ndarray] = None,
    district_mask: Optional[np.ndarray] = None,
    month: str = "2026-06",
) -> Dict:
    """
    Calculate NDVI from Sentinel-2 B8 (NIR) and B4 (Red) bands.
    
    Args:
        nir_band: NIR band array (Sentinel-2 B8)
        red_band: Red band array (Sentinel-2 B4)
        district_mask: Boolean mask for the district boundary
        month: Analysis month in YYYY-MM format
    
    Returns:
        Dictionary with NDVI statistics
    """
    if nir_band is not None and red_band is not None:
        # Real calculation
        nir = nir_band.astype(np.float64)
        red = red_band.astype(np.float64)
        
        # Avoid division by zero
        denominator = nir + red
        ndvi = np.where(denominator > 0, (nir - red) / denominator, 0)
        
        # Clip to valid range
        ndvi = np.clip(ndvi, -1.0, 1.0)
        
        # Apply district mask if provided
        if district_mask is not None:
            ndvi_masked = ndvi[district_mask]
        else:
            ndvi_masked = ndvi.flatten()
        
        # Filter out no-data values
        valid = ndvi_masked[~np.isnan(ndvi_masked)]
        
        return {
            "average_ndvi": float(np.mean(valid)),
            "min_ndvi": float(np.min(valid)),
            "max_ndvi": float(np.max(valid)),
        }
    
    # Demo data: realistic NDVI for Kamrup in monsoon season (June)
    # Kamrup has lush vegetation during monsoon
    return _get_demo_ndvi(month)


def _get_demo_ndvi(month: str) -> Dict:
    """Generate realistic demo NDVI based on season."""
    # Monthly NDVI variation for Kamrup (monsoon region)
    monthly_ndvi = {
        "01": 0.42,  # January - winter, moderate
        "02": 0.38,  # February - dry
        "03": 0.35,  # March - pre-monsoon
        "04": 0.40,  # April - warming
        "05": 0.48,  # May - pre-monsoon showers
        "06": 0.58,  # June - monsoon onset
        "07": 0.65,  # July - peak monsoon
        "08": 0.62,  # August - monsoon
        "09": 0.55,  # September - retreating monsoon
        "10": 0.48,  # October - post-monsoon
        "11": 0.45,  # November - cooling
        "12": 0.43,  # December - winter
    }
    
    month_num = month.split("-")[1] if "-" in month else "06"
    avg_ndvi = monthly_ndvi.get(month_num, 0.58)
    
    return {
        "average_ndvi": avg_ndvi,
        "min_ndvi": round(avg_ndvi - 0.25, 2),
        "max_ndvi": round(avg_ndvi + 0.20, 2),
    }


def generate_ndvi_grid(
    resolution: int = 64,
    average_ndvi: float = 0.58,
    month: str = "2026-06",
) -> List[Dict]:
    """
    Generate a downsampled NDVI grid for frontend visualization.
    
    In production, this would downsample the actual NDVI raster.
    Currently generates realistic spatial variation around the mean.
    """
    np.random.seed(hash(month) % 2**31)
    
    # Create spatially correlated NDVI field
    grid = np.zeros((resolution, resolution))
    
    # Multiple scales of variation
    for octave in range(3):
        freq = 2 ** (octave + 1)
        amplitude = 0.15 / (octave + 1)
        
        x = np.linspace(0, freq * np.pi, resolution)
        y = np.linspace(0, freq * np.pi, resolution)
        xx, yy = np.meshgrid(x, y)
        
        noise = np.sin(xx + octave * 2.5) * np.cos(yy + octave * 1.7)
        grid += noise * amplitude
    
    # Center around average NDVI
    grid = grid - grid.mean() + average_ndvi
    
    # River areas have lower NDVI (water)
    river_y = resolution // 2
    for i in range(resolution):
        valley_width = int(3 + 2 * np.sin(i * 0.15))
        for j in range(max(0, river_y - valley_width), min(resolution, river_y + valley_width)):
            distance = abs(j - river_y) / max(valley_width, 1)
            grid[j, i] = grid[j, i] * distance * 0.5 + 0.05
    
    # Clip to valid range
    grid = np.clip(grid, -0.1, 0.9)
    
    # Convert to list of grid cells
    cells = []
    for i in range(resolution):
        for j in range(resolution):
            cells.append({
                "x": j / (resolution - 1),
                "y": i / (resolution - 1),
                "value": round(float(grid[i, j]), 4),
            })
    
    return cells

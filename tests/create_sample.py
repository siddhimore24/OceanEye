import numpy as np
import rasterio
from rasterio.transform import from_origin


# ---------------------------------------------------------
# CASE_001 - Synthetic Satellite Test Image
# ---------------------------------------------------------

# Image dimensions
HEIGHT = 500
WIDTH = 500

# Make the generated image reproducible
np.random.seed(42)


# ---------------------------------------------------------
# 1. Simulated sea surface
# ---------------------------------------------------------

# Normal sea-like SAR backscatter
image = np.random.normal(
    loc=120,
    scale=15,
    size=(HEIGHT, WIDTH)
).astype(np.float32)


# ---------------------------------------------------------
# 2. Simulated oil-like dark region
# ---------------------------------------------------------

y, x = np.ogrid[:HEIGHT, :WIDTH]

oil_region = (
    ((x - 250) / 100) ** 2
    +
    ((y - 250) / 40) ** 2
) < 1


# Make the simulated oil region darker
image[oil_region] = np.random.normal(
    loc=40,
    scale=5,
    size=np.sum(oil_region)
)


# ---------------------------------------------------------
# 3. Geographic information
# ---------------------------------------------------------

transform = from_origin(
    72.0,       # top-left longitude
    19.0,       # top-left latitude
    0.0001,     # pixel width
    0.0001      # pixel height
)


# ---------------------------------------------------------
# 4. Save GeoTIFF
# ---------------------------------------------------------

output_path = "data/sample/CASE_001.tif"

with rasterio.open(
    output_path,
    "w",
    driver="GTiff",
    height=HEIGHT,
    width=WIDTH,
    count=1,
    dtype="float32",
    crs="EPSG:4326",
    transform=transform
) as dst:

    dst.write(image, 1)


print("CASE_001 created successfully.")
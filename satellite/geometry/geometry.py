import numpy as np
import geopandas as gpd
from rasterio.features import shapes
from shapely.geometry import shape
from shapely.ops import unary_union


def mask_to_polygons(
    mask: np.ndarray,
    transform,
    crs
):
    """
    Convert a binary spill mask into geographic polygons.

    Parameters
    ----------
    mask : np.ndarray
        Binary mask where:
            255 = oil-like candidate
            0   = background

    transform :
        Raster-to-geographic coordinate transformation.

    crs :
        Coordinate reference system of the raster.

    Returns
    -------
    list
        List of Shapely polygons.
    """

    polygons = []

    for geometry, value in shapes(
        mask,
        mask=(mask > 0),
        transform=transform
    ):

        if value > 0:
            polygons.append(
                shape(geometry)
            )

    return polygons


def merge_polygons(polygons):
    """
    Merge individual candidate polygons into one
    combined spill geometry.
    """

    if not polygons:
        return None

    return unary_union(polygons)


def calculate_area(
    geometry,
    crs
):
    """
    Calculate spill area in square kilometres.

    Area is calculated using an estimated projected CRS
    rather than directly using latitude/longitude degrees.
    """

    if geometry is None:
        return 0.0

    gdf = gpd.GeoDataFrame(
        geometry=[geometry],
        crs=crs
    )

    projected_gdf = gdf.to_crs(
        gdf.estimate_utm_crs()
    )

    area_m2 = projected_gdf.geometry.iloc[0].area

    area_km2 = area_m2 / 1_000_000

    return float(area_km2)


def calculate_centroid(
    geometry,
    crs
):
    """
    Calculate the geographic centroid in WGS84
    longitude/latitude coordinates.
    """

    if geometry is None:
        return None

    gdf = gpd.GeoDataFrame(
        geometry=[geometry],
        crs=crs
    )

    projected_gdf = gdf.to_crs(
        gdf.estimate_utm_crs()
    )

    centroid = projected_gdf.geometry.iloc[0].centroid

    centroid_gdf = gpd.GeoDataFrame(
        geometry=[centroid],
        crs=projected_gdf.crs
    )

    centroid_wgs84 = centroid_gdf.to_crs(
        "EPSG:4326"
    ).geometry.iloc[0]

    return {
        "longitude": float(centroid_wgs84.x),
        "latitude": float(centroid_wgs84.y)
    }


def extract_spill_geometry(
    mask: np.ndarray,
    transform,
    crs
):
    """
    Complete geometry extraction pipeline.

    Steps:
        1. Convert mask to polygons
        2. Merge polygons
        3. Calculate area
        4. Calculate centroid
    """

    polygons = mask_to_polygons(
        mask,
        transform,
        crs
    )

    if not polygons:
        return {
            "geometry": None,
            "area_km2": 0.0,
            "centroid": None
        }

    geometry = merge_polygons(
        polygons
    )

    area_km2 = calculate_area(
        geometry,
        crs
    )

    centroid = calculate_centroid(
        geometry,
        crs
    )

    return {
        "geometry": geometry,
        "area_km2": area_km2,
        "centroid": centroid
    }
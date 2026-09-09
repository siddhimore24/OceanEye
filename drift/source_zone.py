import numpy as np
from shapely.geometry import box
from shapely.ops import unary_union


def calculate_source_density(
    source_positions,
    grid_size=20,
):
    """
    Calculate a normalized spatial density from backward particle positions.
    """

    if not source_positions:
        raise ValueError("source_positions cannot be empty.")

    if grid_size < 2:
        raise ValueError("grid_size must be at least 2.")

    latitudes = np.array(
        [position["latitude"] for position in source_positions],
        dtype=float,
    )

    longitudes = np.array(
        [position["longitude"] for position in source_positions],
        dtype=float,
    )

    if not np.all(np.isfinite(latitudes)):
        raise ValueError("Source latitudes contain invalid values.")

    if not np.all(np.isfinite(longitudes)):
        raise ValueError("Source longitudes contain invalid values.")

    lat_min = float(latitudes.min())
    lat_max = float(latitudes.max())
    lon_min = float(longitudes.min())
    lon_max = float(longitudes.max())

    if lat_min == lat_max:
        lat_min -= 0.0001
        lat_max += 0.0001

    if lon_min == lon_max:
        lon_min -= 0.0001
        lon_max += 0.0001

    density, lat_edges, lon_edges = np.histogram2d(
        latitudes,
        longitudes,
        bins=grid_size,
        range=[
            [lat_min, lat_max],
            [lon_min, lon_max],
        ],
    )

    total_particles = density.sum()

    if total_particles == 0:
        raise ValueError("No particles were counted.")

    normalized_density = density / total_particles

    return {
        "density": normalized_density,
        "latitude_edges": lat_edges,
        "longitude_edges": lon_edges,
        "latitude_range": (lat_min, lat_max),
        "longitude_range": (lon_min, lon_max),
    }


def extract_high_probability_zone(
    density_result,
    threshold=0.5,
):
    """
    Extract the high-density source zone from a normalized
    particle-density grid.

    threshold:
        Fraction of the maximum density used to identify
        high-density cells.
    """

    if not 0 < threshold <= 1:
        raise ValueError(
            "threshold must be greater than 0 and at most 1."
        )

    density = density_result["density"]

    max_density = float(np.max(density))

    if max_density <= 0:
        raise ValueError("Density grid contains no positive values.")

    mask = density >= threshold * max_density

    lat_edges = density_result["latitude_edges"]
    lon_edges = density_result["longitude_edges"]

    selected_rows, selected_cols = np.where(mask)

    if len(selected_rows) == 0:
        raise ValueError(
            "No cells satisfy the selected threshold."
        )

    selected_latitudes = []
    selected_longitudes = []

    for row, col in zip(selected_rows, selected_cols):
        selected_latitudes.append(
            (lat_edges[row] + lat_edges[row + 1]) / 2
        )

        selected_longitudes.append(
            (lon_edges[col] + lon_edges[col + 1]) / 2
        )

    return {
        "mask": mask,
        "threshold": threshold,
        "max_density": max_density,
        "selected_cells": int(mask.sum()),
        "latitude_range": (
            float(min(selected_latitudes)),
            float(max(selected_latitudes)),
        ),
        "longitude_range": (
            float(min(selected_longitudes)),
            float(max(selected_longitudes)),
        ),
    }


def create_source_zone_polygon(
    density_result,
    threshold=0.5,
    min_component_area=0.0,
    merge_distance=0.0,
):
    """
    Convert high-density grid cells into a geographic polygon.

    Parameters
    ----------
    density_result : dict
        Output from calculate_source_density().

    threshold : float
        Fraction of maximum density used to select cells.

    min_component_area : float
        Remove very small disconnected components.

    merge_distance : float
        Distance used to merge nearby components.
    """

    zone = extract_high_probability_zone(
        density_result,
        threshold=threshold,
    )

    mask = zone["mask"]

    lat_edges = density_result["latitude_edges"]
    lon_edges = density_result["longitude_edges"]

    polygons = []

    rows, cols = np.where(mask)

    for row, col in zip(rows, cols):

        cell_polygon = box(
            lon_edges[col],
            lat_edges[row],
            lon_edges[col + 1],
            lat_edges[row + 1],
        )

        polygons.append(cell_polygon)

    if not polygons:
        raise ValueError(
            "Unable to create source-zone polygon."
        )

    polygon = unary_union(polygons)

    # --------------------------------------------------------
    # Remove very small disconnected components
    # --------------------------------------------------------

    if min_component_area > 0:

        if polygon.geom_type == "MultiPolygon":

            components = [
                component
                for component in polygon.geoms
                if component.area >= min_component_area
            ]

            if not components:
                raise ValueError(
                    "All source-zone components were removed."
                )

            polygon = unary_union(components)

        elif polygon.area < min_component_area:

            raise ValueError(
                "Source-zone polygon is smaller than "
                "min_component_area."
            )

    # --------------------------------------------------------
    # Merge nearby components
    # --------------------------------------------------------

    if merge_distance > 0:

        polygon = polygon.buffer(
            merge_distance
        ).buffer(
            -merge_distance
        )

    return polygon


def source_zone_to_geojson(polygon):
    """
    Convert a Shapely source-zone polygon into
    GeoJSON geometry format.
    """

    if polygon.is_empty:
        raise ValueError(
            "Cannot convert an empty polygon to GeoJSON."
        )

    return {
        "type": polygon.geom_type,
        "coordinates": list(
            polygon.__geo_interface__["coordinates"]
        ),
    }
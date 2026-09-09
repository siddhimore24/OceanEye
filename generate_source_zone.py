import json

from drift.metocean import CurrentField
from drift.wind import WindField
from drift.drift_simulator import generate_backward_ensemble
from drift.source_zone import (
    calculate_source_density,
    create_source_zone_polygon,
    source_zone_to_geojson,
)


# ============================================================
# FILE PATHS
# ============================================================

CURRENT_FILE = (
    "data/CASE_001/metocean/currents/"
    "fig3_vel_oil_drifter.nc"
)

WIND_FILE = (
    "data/CASE_001/metocean/wind/"
    "277b9c1e8c32745585f1bdf0bfe6199f.nc"
)

OUTPUT_FILE = (
    "data/CASE_001/source_zone.geojson"
)


# ============================================================
# CASE CONFIGURATION
# ============================================================

START_LATITUDE = 25.0
START_LONGITUDE = -85.0

NUM_PARTICLES = 100

POSITION_UNCERTAINTY_DEG = 0.01

WINDAGE_MIN = 0.02
WINDAGE_MAX = 0.04

STEPS = 2
DT_SECONDS = 3600.0

START_TIME_INDEX = 2

RANDOM_SEED = 42

GRID_SIZE = 20

# High-density threshold
THRESHOLD = 0.5


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("SEATRACE - SOURCE ZONE GENERATION")
    print("=" * 60)

    # --------------------------------------------------------
    # Load datasets
    # --------------------------------------------------------

    print("\nLoading metocean datasets...")

    current_field = CurrentField(CURRENT_FILE)
    wind_field = WindField(WIND_FILE)

    print("Current dataset loaded.")
    print("Wind dataset loaded.")

    # --------------------------------------------------------
    # Generate backward ensemble
    # --------------------------------------------------------

    print("\nGenerating backward drift ensemble...")

    source_positions = generate_backward_ensemble(
        start_latitude=START_LATITUDE,
        start_longitude=START_LONGITUDE,
        current_field=current_field,
        wind_field=wind_field,
        num_particles=NUM_PARTICLES,
        position_uncertainty_deg=POSITION_UNCERTAINTY_DEG,
        windage_min=WINDAGE_MIN,
        windage_max=WINDAGE_MAX,
        steps=STEPS,
        dt_seconds=DT_SECONDS,
        start_time_index=START_TIME_INDEX,
        random_seed=RANDOM_SEED,
    )

    print(
        f"Generated {len(source_positions)} "
        "backward source positions."
    )

    # --------------------------------------------------------
    # Calculate density
    # --------------------------------------------------------

    print("\nCalculating source density...")

    density_result = calculate_source_density(
        source_positions,
        grid_size=GRID_SIZE,
    )

    print("Source density calculated.")

    print(
        "Density sum:",
        density_result["density"].sum(),
    )

    # --------------------------------------------------------
    # Create source-zone polygon
    # --------------------------------------------------------

    print("\nCreating high-density source zone...")

    polygon = create_source_zone_polygon(
        density_result,
        threshold=THRESHOLD,
    )

    print("Source zone created.")

    print(
        "Geometry type:",
        polygon.geom_type,
    )

    print(
        "Polygon area:",
        polygon.area,
    )

    # --------------------------------------------------------
    # Convert to GeoJSON
    # --------------------------------------------------------

    print("\nConverting source zone to GeoJSON...")

    geometry = source_zone_to_geojson(
        polygon
    )

    geojson = {
        "type": "Feature",
        "properties": {
            "case_id": "CASE_001",
            "num_particles": NUM_PARTICLES,
            "threshold": THRESHOLD,
            "windage_min": WINDAGE_MIN,
            "windage_max": WINDAGE_MAX,
            "steps": STEPS,
            "dt_seconds": DT_SECONDS,
            "start_time_index": START_TIME_INDEX,
            "random_seed": RANDOM_SEED,
            "description": (
                "Relative high-density source zone "
                "from backward drift ensemble"
            ),
        },
        "geometry": geometry,
    }

    # --------------------------------------------------------
    # Save GeoJSON
    # --------------------------------------------------------

    print("\nSaving GeoJSON...")

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            geojson,
            file,
            indent=2,
        )

    # --------------------------------------------------------
    # Close datasets
    # --------------------------------------------------------

    current_field.close()
    wind_field.close()

    print("\nSource zone saved successfully.")

    print(
        "Output:",
        OUTPUT_FILE,
    )

    print("\n" + "=" * 60)
    print("SOURCE ZONE GENERATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
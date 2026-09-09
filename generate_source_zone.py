import json

from drift.metocean import CurrentField
from drift.wind import WindField
from drift.drift_simulator import generate_backward_ensemble
from drift.source_zone import (
    calculate_source_density,
    create_source_zone_polygon,
    source_zone_to_geojson,
)


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


# ---------------------------------------------------------
# CASE CONFIGURATION
# ---------------------------------------------------------

CASE_ID = "CASE_001"
SPILL_ID = "CASE_001"

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
THRESHOLD = 0.5


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------

def main():

    print("=" * 60)
    print("SEATRACE - SOURCE ZONE GENERATION")
    print("=" * 60)

    # -----------------------------------------------------
    # LOAD METOCEAN DATA
    # -----------------------------------------------------

    print("\nLoading metocean datasets...")

    current_field = CurrentField(CURRENT_FILE)
    wind_field = WindField(WIND_FILE)

    print("Current dataset loaded.")
    print("Wind dataset loaded.")

    # -----------------------------------------------------
    # BACKWARD DRIFT ENSEMBLE
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # SOURCE DENSITY
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # SOURCE ZONE
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # GEOJSON GEOMETRY
    # -----------------------------------------------------

    print("\nConverting source zone to GeoJSON...")

    geometry = source_zone_to_geojson(
        polygon
    )

    # -----------------------------------------------------
    # RELEASE-TIME WINDOW
    # -----------------------------------------------------
    #
    # The current dataset uses numerical time indices and
    # does not contain absolute timestamps.
    #
    # Therefore we DO NOT invent an actual release timestamp.
    #
    # AIS integration can use this field later when the
    # upstream spill-detection module provides an absolute
    # detection timestamp.
    # -----------------------------------------------------

    release_time_window = {
        "start": None,
        "end": None,
        "status": "unavailable_from_current_case",
        "reason": (
            "The current-field dataset contains numerical "
            "time indices rather than absolute timestamps."
        ),
        "current_start_time_index": START_TIME_INDEX,
    }

    # -----------------------------------------------------
    # UNCERTAINTY
    # -----------------------------------------------------

    uncertainty = {
        "position_uncertainty_deg": (
            POSITION_UNCERTAINTY_DEG
        ),
        "windage_range": [
            WINDAGE_MIN,
            WINDAGE_MAX,
        ],
        "num_particles": NUM_PARTICLES,
        "probability_calibration": "not_calibrated",
        "interpretation": (
            "Relative ensemble uncertainty; "
            "not a calibrated probability."
        ),
    }

    # -----------------------------------------------------
    # OUTPUT GEOJSON
    # -----------------------------------------------------

    geojson = {
        "type": "Feature",

        "properties": {

            # Shared identifier
            "spill_id": SPILL_ID,

            # Case information
            "case_id": CASE_ID,

            # Observed spill position used for this
            # representative validation case
            "spill_latitude": START_LATITUDE,
            "spill_longitude": START_LONGITUDE,

            # -------------------------------------------------
            # RELEASE TIME
            # -------------------------------------------------

            "release_time_window": release_time_window,

            # -------------------------------------------------
            # UNCERTAINTY
            # -------------------------------------------------

            "uncertainty": uncertainty,

            # -------------------------------------------------
            # MODEL PARAMETERS
            # -------------------------------------------------

            "num_particles": NUM_PARTICLES,

            "position_uncertainty_deg": (
                POSITION_UNCERTAINTY_DEG
            ),

            "windage_min": WINDAGE_MIN,
            "windage_max": WINDAGE_MAX,

            "random_seed": RANDOM_SEED,

            "backward_steps": STEPS,

            "model_timestep_seconds": (
                DT_SECONDS
            ),

            "start_time_index": START_TIME_INDEX,

            "grid_size": GRID_SIZE,

            "threshold": THRESHOLD,

            # -------------------------------------------------
            # INTERPRETATION
            # -------------------------------------------------

            "zone_type": (
                "relative_high_density_source_zone"
            ),

            "probability_calibration": (
                "not_calibrated"
            ),

            "description": (
                "Relative high-density source zone "
                "derived from a backward drift ensemble. "
                "This zone represents possible source "
                "locations and is not an exact source point "
                "or a calibrated probability."
            ),

            # -------------------------------------------------
            # TEMPORAL INFORMATION
            # -------------------------------------------------

            "temporal_alignment": (
                "representative_case_alignment"
            ),

            "current_time_type": (
                "dataset_index"
            ),

            # -------------------------------------------------
            # DATA LIMITATION
            # -------------------------------------------------

            "note": (
                "Current dataset contains numerical "
                "time indices rather than absolute "
                "timestamps. Wind forcing uses the "
                "downloaded ERA5 timestamps. An absolute "
                "release-time window is therefore not "
                "established for this representative case."
            ),
        },

        "geometry": geometry,
    }

    # -----------------------------------------------------
    # SAVE OUTPUT
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CLOSE DATASETS
    # -----------------------------------------------------

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
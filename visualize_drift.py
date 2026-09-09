import json

import folium

from drift.metocean import CurrentField
from drift.wind import WindField
from drift.drift_simulator import (
    generate_backward_ensemble,
    simulate_forward_drift,
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

SOURCE_ZONE_FILE = (
    "data/CASE_001/source_zone.geojson"
)

OUTPUT_MAP = (
    "data/CASE_001/drift_map.html"
)


# ============================================================
# CASE CONFIGURATION
# ============================================================

SPILL_LATITUDE = 25.0
SPILL_LONGITUDE = -85.0

NUM_PARTICLES = 100

POSITION_UNCERTAINTY_DEG = 0.01

WINDAGE_MIN = 0.02
WINDAGE_MAX = 0.04

BACKWARD_STEPS = 2

DT_SECONDS = 3600.0

START_TIME_INDEX = 2

RANDOM_SEED = 42


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("SEATRACE - DRIFT VISUALIZATION")
    print("=" * 60)

    # --------------------------------------------------------
    # Load datasets
    # --------------------------------------------------------

    print("\nLoading metocean datasets...")

    current_field = CurrentField(CURRENT_FILE)
    wind_field = WindField(WIND_FILE)

    print("Datasets loaded.")

    # --------------------------------------------------------
    # Generate backward ensemble
    # --------------------------------------------------------

    print("\nGenerating backward trajectories...")

    source_positions = generate_backward_ensemble(
        start_latitude=SPILL_LATITUDE,
        start_longitude=SPILL_LONGITUDE,
        current_field=current_field,
        wind_field=wind_field,
        num_particles=NUM_PARTICLES,
        position_uncertainty_deg=POSITION_UNCERTAINTY_DEG,
        windage_min=WINDAGE_MIN,
        windage_max=WINDAGE_MAX,
        steps=BACKWARD_STEPS,
        dt_seconds=DT_SECONDS,
        start_time_index=START_TIME_INDEX,
        random_seed=RANDOM_SEED,
    )

    print(
        f"Generated {len(source_positions)} "
        "backward source positions."
    )

    # --------------------------------------------------------
    # Create map
    # --------------------------------------------------------

    print("\nCreating map...")

    fmap = folium.Map(
        location=[
            SPILL_LATITUDE,
            SPILL_LONGITUDE,
        ],
        zoom_start=11,
        tiles="OpenStreetMap",
    )

    # --------------------------------------------------------
    # Spill observation
    # --------------------------------------------------------

    folium.Marker(
        location=[
            SPILL_LATITUDE,
            SPILL_LONGITUDE,
        ],
        popup=(
            "<b>Observed Spill Location</b><br>"
            "Latitude: 25.00000<br>"
            "Longitude: -85.00000"
        ),
        tooltip="Observed Spill",
    ).add_to(fmap)

    # --------------------------------------------------------
    # Backward particle layer
    # --------------------------------------------------------

    particle_group = folium.FeatureGroup(
        name="Backward Source Particles"
    )

    for position in source_positions:

        folium.CircleMarker(
            location=[
                position["latitude"],
                position["longitude"],
            ],
            radius=4,
            fill=True,
            fill_opacity=0.7,
            popup=(
                f"<b>Particle "
                f"{position['particle_id']}</b><br>"
                f"Latitude: "
                f"{position['latitude']:.5f}<br>"
                f"Longitude: "
                f"{position['longitude']:.5f}<br>"
                f"Windage: "
                f"{position['windage_factor']:.4f}"
            ),
        ).add_to(particle_group)

    particle_group.add_to(fmap)

    # --------------------------------------------------------
    # Source zone
    # --------------------------------------------------------

    print("\nLoading source zone...")

    with open(
        SOURCE_ZONE_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        source_zone = json.load(file)

    folium.GeoJson(
        source_zone,
        name="High-Density Source Zone",
        style_function=lambda feature: {
            "fillOpacity": 0.35,
            "weight": 3,
        },
        highlight_function=lambda feature: {
            "weight": 5,
            "fillOpacity": 0.5,
        },
        tooltip="Relative High-Density Source Zone",
    ).add_to(fmap)

    # --------------------------------------------------------
    # Forward drift
    # --------------------------------------------------------

    print("\nGenerating forward drift trajectory...")

    forward_trajectory = simulate_forward_drift(
        start_latitude=SPILL_LATITUDE,
        start_longitude=SPILL_LONGITUDE,
        current_field=current_field,
        wind_field=wind_field,
        time_indices=[0, 1, 2],
        dt_seconds=DT_SECONDS,
        windage_factor=0.03,
    )

    forward_coordinates = []

    for position in forward_trajectory:

        forward_coordinates.append(
            [
                position["latitude"],
                position["longitude"],
            ]
        )

    folium.PolyLine(
        locations=forward_coordinates,
        weight=5,
        tooltip="Forward Drift Trajectory",
    ).add_to(fmap)

    # --------------------------------------------------------
    # Layer control
    # --------------------------------------------------------

    folium.LayerControl().add_to(fmap)

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    fmap.save(OUTPUT_MAP)

    current_field.close()
    wind_field.close()

    print("\nMap saved successfully.")

    print(
        "Output:",
        OUTPUT_MAP,
    )

    print("\n" + "=" * 60)
    print("DRIFT VISUALIZATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
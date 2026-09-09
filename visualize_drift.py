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

    current_field = CurrentField(
        CURRENT_FILE
    )

    wind_field = WindField(
        WIND_FILE
    )

    print("Datasets loaded.")

    # --------------------------------------------------------
    # Generate backward ensemble
    # --------------------------------------------------------

    print(
        "\nGenerating backward trajectories..."
    )

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

    # ========================================================
    # OBSERVED SPILL
    # ========================================================

    spill_group = folium.FeatureGroup(
        name="Observed Spill"
    )

    folium.Marker(
        location=[
            SPILL_LATITUDE,
            SPILL_LONGITUDE,
        ],
        popup=(
            "<b>Observed Spill</b><br>"
            "Latitude: 25.00000<br>"
            "Longitude: -85.00000"
        ),
        tooltip="Observed Spill",
        icon=folium.Icon(
            color="red",
            icon="warning-sign",
            prefix="glyphicon",
        ),
    ).add_to(spill_group)

    spill_group.add_to(fmap)

    # ========================================================
    # BACKWARD SOURCE PARTICLES
    # ========================================================

    particle_group = folium.FeatureGroup(
        name="Backward Source Particles"
    )

    for position in source_positions:

        folium.CircleMarker(
            location=[
                position["latitude"],
                position["longitude"],
            ],
            radius=3,
            color="orange",
            fill=True,
            fill_color="orange",
            fill_opacity=0.65,
            opacity=0.8,
            popup=(
                f"<b>Backward Particle "
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

    # ========================================================
    # RELATIVE SOURCE ZONE
    # ========================================================

    print(
        "\nLoading source zone..."
    )

    with open(
        SOURCE_ZONE_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        source_zone = json.load(file)

    source_zone_group = folium.FeatureGroup(
        name="Relative Source Zone"
    )

    folium.GeoJson(
        source_zone,
        style_function=lambda feature: {
            "color": "yellow",
            "weight": 4,
            "fillColor": "yellow",
            "fillOpacity": 0.35,
            "dashArray": "8, 5",
        },
        highlight_function=lambda feature: {
            "color": "yellow",
            "weight": 6,
            "fillOpacity": 0.50,
        },
        tooltip=(
            "Relative High-Density Source Zone"
        ),
    ).add_to(source_zone_group)

    source_zone_group.add_to(fmap)

    # ========================================================
    # FORWARD DRIFT
    # ========================================================

    print(
        "\nGenerating forward drift trajectory..."
    )

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

    forward_group = folium.FeatureGroup(
        name="Forward Drift"
    )

    folium.PolyLine(
        locations=forward_coordinates,
        color="blue",
        weight=5,
        opacity=0.9,
        tooltip="Forward Drift Trajectory",
    ).add_to(forward_group)

    # Forward trajectory points

    for index, position in enumerate(
        forward_trajectory
    ):

        if index == 0:
            continue

        folium.CircleMarker(
            location=[
                position["latitude"],
                position["longitude"],
            ],
            radius=5,
            color="blue",
            fill=True,
            fill_color="blue",
            fill_opacity=0.9,
            popup=(
                f"<b>Forward Step "
                f"{position['step']}</b><br>"
                f"Latitude: "
                f"{position['latitude']:.5f}<br>"
                f"Longitude: "
                f"{position['longitude']:.5f}"
            ),
        ).add_to(forward_group)

    forward_group.add_to(fmap)

    # ========================================================
    # LEGEND
    # ========================================================

    legend_html = """
    <div style="
        position: fixed;
        bottom: 30px;
        left: 30px;
        width: 250px;
        z-index: 9999;
        background-color: white;
        border: 2px solid #555;
        border-radius: 7px;
        padding: 13px;
        font-size: 13px;
        box-shadow: 2px 2px 7px rgba(0,0,0,0.3);
    ">

        <b style="font-size: 16px;">
            SeaTrace — Drift Module
        </b>

        <hr style="margin: 8px 0;">

        <div style="margin: 6px 0;">
            <span style="
                display:inline-block;
                width:12px;
                height:12px;
                background:red;
                border-radius:50%;
                margin-right:7px;
            "></span>
            Observed Spill
        </div>

        <div style="margin: 6px 0;">
            <span style="
                display:inline-block;
                width:12px;
                height:12px;
                background:orange;
                border-radius:50%;
                margin-right:7px;
            "></span>
            Backward Source Particles
        </div>

        <div style="margin: 6px 0;">
            <span style="
                display:inline-block;
                width:12px;
                height:12px;
                background:yellow;
                border:2px dashed #555;
                margin-right:7px;
            "></span>
            Relative Source Zone
        </div>

        <div style="margin: 6px 0;">
            <span style="
                display:inline-block;
                width:25px;
                height:4px;
                background:blue;
                margin-right:7px;
                vertical-align:middle;
            "></span>
            Forward Drift
        </div>

        <hr style="margin: 8px 0;">

        <div style="font-size: 11px; line-height: 1.4;">
            Source zone represents possible
            source locations estimated from
            backward particle advection.
        </div>

    </div>
    """

    fmap.get_root().html.add_child(
        folium.Element(
            legend_html
        )
    )

    # ========================================================
    # LAYER CONTROL
    # ========================================================

    folium.LayerControl(
        collapsed=False
    ).add_to(fmap)

    # ========================================================
    # SAVE
    # ========================================================

    fmap.save(
        OUTPUT_MAP
    )

    current_field.close()
    wind_field.close()

    print(
        "\nMap saved successfully."
    )

    print(
        "Output:",
        OUTPUT_MAP,
    )

    print(
        "\n" + "=" * 60
    )

    print(
        "DRIFT VISUALIZATION COMPLETE"
    )

    print(
        "=" * 60
    )


if __name__ == "__main__":
    main()
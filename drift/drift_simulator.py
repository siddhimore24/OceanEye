import numpy as np

from drift.particle_model import (
    advance_particle,
    combine_surface_velocity,
)


def simulate_forward_drift(
    start_latitude,
    start_longitude,
    current_field,
    wind_field,
    time_indices,
    dt_seconds,
    windage_factor=0.03,
):
    """
    Simulate forward movement of one oil particle.

    Parameters
    ----------
    start_latitude : float
        Starting latitude.

    start_longitude : float
        Starting longitude.

    current_field : CurrentField
        Ocean-current dataset.

    wind_field : WindField
        Wind dataset.

    time_indices : list
        Explicit sequence of forcing indices.

        IMPORTANT:
        The current and wind datasets do not necessarily
        share the same time coordinate. Therefore, callers
        should provide an explicit mapping rather than
        assuming index-to-index synchronization.

    dt_seconds : float
        Simulation timestep in seconds.

    windage_factor : float
        Fraction of wind velocity contributing to surface
        oil movement.
    """

    latitude = float(start_latitude)
    longitude = float(start_longitude)

    trajectory = [
        {
            "step": 0,
            "latitude": latitude,
            "longitude": longitude,
        }
    ]

    for step, time_index in enumerate(
        time_indices,
        start=1,
    ):

        # ----------------------------------------------------
        # Current forcing
        # ----------------------------------------------------

        current_u, current_v = current_field.get_current(
            latitude=latitude,
            longitude=longitude,
            time_index=time_index,
        )

        # ----------------------------------------------------
        # Wind forcing
        # ----------------------------------------------------

        wind_u, wind_v = wind_field.get_wind(
            latitude=latitude,
            longitude=longitude,
            time_index=time_index,
        )

        # ----------------------------------------------------
        # Combine current + windage
        # ----------------------------------------------------

        effective_u, effective_v = combine_surface_velocity(
            current_u_ms=current_u,
            current_v_ms=current_v,
            wind_u_ms=wind_u,
            wind_v_ms=wind_v,
            windage_factor=windage_factor,
        )

        # ----------------------------------------------------
        # Move particle
        # ----------------------------------------------------

        latitude, longitude = advance_particle(
            latitude=latitude,
            longitude=longitude,
            u_ms=effective_u,
            v_ms=effective_v,
            dt_seconds=dt_seconds,
        )

        trajectory.append(
            {
                "step": step,
                "latitude": latitude,
                "longitude": longitude,
            }
        )

    return trajectory


def simulate_backward_drift(
    start_latitude,
    start_longitude,
    current_field,
    wind_field,
    steps=10,
    dt_seconds=3600.0,
    windage_factor=0.03,
    start_time_index=0,
):
    """
    Estimate possible source locations by running the drift
    model backward.

    The model reverses the advection component by using a
    negative timestep.

    IMPORTANT:
    This is a backward-advection estimate, not a reversal
    of physical diffusion.
    """

    trajectory = []

    latitude = float(start_latitude)
    longitude = float(start_longitude)

    trajectory.append(
        {
            "step": 0,
            "latitude": latitude,
            "longitude": longitude,
        }
    )

    for step in range(
        1,
        steps + 1,
    ):

        time_index = (
            start_time_index
            - (step - 1)
        )

        if time_index < 0:
            break

        # ----------------------------------------------------
        # Current forcing
        # ----------------------------------------------------

        current_u, current_v = current_field.get_current(
            latitude=latitude,
            longitude=longitude,
            time_index=time_index,
        )

        # ----------------------------------------------------
        # Wind forcing
        # ----------------------------------------------------

        wind_u, wind_v = wind_field.get_wind(
            latitude=latitude,
            longitude=longitude,
            time_index=time_index,
        )

        # ----------------------------------------------------
        # Combine current + windage
        # ----------------------------------------------------

        effective_u, effective_v = combine_surface_velocity(
            current_u_ms=current_u,
            current_v_ms=current_v,
            wind_u_ms=wind_u,
            wind_v_ms=wind_v,
            windage_factor=windage_factor,
        )

        # ----------------------------------------------------
        # Move backward
        # ----------------------------------------------------

        latitude, longitude = advance_particle(
            latitude=latitude,
            longitude=longitude,
            u_ms=effective_u,
            v_ms=effective_v,
            dt_seconds=-dt_seconds,
        )

        trajectory.append(
            {
                "step": step,
                "latitude": latitude,
                "longitude": longitude,
            }
        )

    return trajectory


def generate_backward_ensemble(
    start_latitude,
    start_longitude,
    current_field,
    wind_field,
    num_particles=100,
    position_uncertainty_deg=0.02,
    windage_min=0.02,
    windage_max=0.04,
    steps=3,
    dt_seconds=3600.0,
    start_time_index=2,
    random_seed=42,
):
    """
    Generate multiple backward drift trajectories.

    Each particle receives:

    - a slightly perturbed starting position
    - a randomly sampled windage factor

    The final backward positions are returned as possible
    source locations.
    """

    if num_particles <= 0:
        raise ValueError(
            "num_particles must be greater than zero."
        )

    if position_uncertainty_deg < 0:
        raise ValueError(
            "position_uncertainty_deg must be non-negative."
        )

    if windage_min < 0 or windage_max < 0:
        raise ValueError(
            "Windage values must be non-negative."
        )

    if windage_min > windage_max:
        raise ValueError(
            "windage_min cannot be greater than windage_max."
        )

    rng = np.random.default_rng(
        random_seed
    )

    source_positions = []

    for particle_id in range(
        num_particles
    ):

        # ----------------------------------------------------
        # Initial position uncertainty
        # ----------------------------------------------------

        particle_latitude = (
            start_latitude
            + rng.uniform(
                -position_uncertainty_deg,
                position_uncertainty_deg,
            )
        )

        particle_longitude = (
            start_longitude
            + rng.uniform(
                -position_uncertainty_deg,
                position_uncertainty_deg,
            )
        )

        # ----------------------------------------------------
        # Windage uncertainty
        # ----------------------------------------------------

        particle_windage = rng.uniform(
            windage_min,
            windage_max,
        )

        # ----------------------------------------------------
        # Backward trajectory
        # ----------------------------------------------------

        trajectory = simulate_backward_drift(
            start_latitude=particle_latitude,
            start_longitude=particle_longitude,
            current_field=current_field,
            wind_field=wind_field,
            steps=steps,
            dt_seconds=dt_seconds,
            windage_factor=particle_windage,
            start_time_index=start_time_index,
        )

        # ----------------------------------------------------
        # Final possible source position
        # ----------------------------------------------------

        final_position = trajectory[-1]

        source_positions.append(
            {
                "particle_id": particle_id,

                "latitude":
                    final_position["latitude"],

                "longitude":
                    final_position["longitude"],

                "windage_factor":
                    particle_windage,
            }
        )

    return source_positions
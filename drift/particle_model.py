import math


EARTH_RADIUS_M = 6_371_000.0


def advance_particle(latitude, longitude, u_ms, v_ms, dt_seconds):
    """
    Move one particle using a surface-current velocity.

    Parameters
    ----------
    latitude : float
        Particle latitude in degrees.
    longitude : float
        Particle longitude in degrees.
    u_ms : float
        East-west current velocity in m/s.
    v_ms : float
        North-south current velocity in m/s.
    dt_seconds : float
        Simulation time step in seconds.

    Returns
    -------
    tuple
        New latitude and longitude in degrees.
    """

    # Distance travelled in the east-west and north-south directions.
    east_distance_m = u_ms * dt_seconds
    north_distance_m = v_ms * dt_seconds

    # Convert north/south distance to latitude change.
    delta_latitude = north_distance_m / EARTH_RADIUS_M
    delta_latitude_deg = math.degrees(delta_latitude)

    # Convert east/west distance to longitude change.
    latitude_rad = math.radians(latitude)

    cos_latitude = math.cos(latitude_rad)

    if abs(cos_latitude) < 1e-12:
        raise ValueError(
            "Longitude displacement is undefined near the poles."
        )

    delta_longitude = east_distance_m / (
        EARTH_RADIUS_M * cos_latitude
    )
    delta_longitude_deg = math.degrees(delta_longitude)

    new_latitude = latitude + delta_latitude_deg
    new_longitude = longitude + delta_longitude_deg

    return new_latitude, new_longitude

def combine_surface_velocity(
    current_u_ms,
    current_v_ms,
    wind_u_ms,
    wind_v_ms,
    windage_factor=0.03,
):
    """
    Combine ocean current and windage to obtain
    effective surface velocity.

    Args:
        current_u_ms: East-west ocean current (m/s)
        current_v_ms: North-south ocean current (m/s)
        wind_u_ms: East-west 10 m wind (m/s)
        wind_v_ms: North-south 10 m wind (m/s)
        windage_factor: Fraction of wind velocity applied to the particle

    Returns:
        Effective east-west and north-south velocity (m/s)
    """

    if windage_factor < 0:
        raise ValueError("windage_factor must be non-negative")

    effective_u_ms = current_u_ms + windage_factor * wind_u_ms
    effective_v_ms = current_v_ms + windage_factor * wind_v_ms

    return effective_u_ms, effective_v_ms
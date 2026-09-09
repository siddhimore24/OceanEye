import unittest

from drift.particle_model import (
    advance_particle,
    combine_surface_velocity,
)


class TestParticleModel(unittest.TestCase):

    def test_eastward_motion(self):
        lat, lon = advance_particle(
            latitude=25.0,
            longitude=-85.0,
            u_ms=1.0,
            v_ms=0.0,
            dt_seconds=3600.0,
        )

        self.assertAlmostEqual(lat, 25.0, places=10)
        self.assertGreater(lon, -85.0)

    def test_northward_motion(self):
        lat, lon = advance_particle(
            latitude=25.0,
            longitude=-85.0,
            u_ms=0.0,
            v_ms=1.0,
            dt_seconds=3600.0,
        )

        self.assertGreater(lat, 25.0)
        self.assertAlmostEqual(lon, -85.0, places=10)

    def test_zero_current(self):
        lat, lon = advance_particle(
            latitude=25.0,
            longitude=-85.0,
            u_ms=0.0,
            v_ms=0.0,
            dt_seconds=3600.0,
        )

        self.assertAlmostEqual(lat, 25.0, places=10)
        self.assertAlmostEqual(lon, -85.0, places=10)


class TestSurfaceVelocity(unittest.TestCase):

    def test_combine_surface_velocity(self):
        u, v = combine_surface_velocity(
            current_u_ms=1.0,
            current_v_ms=2.0,
            wind_u_ms=10.0,
            wind_v_ms=20.0,
            windage_factor=0.03,
        )

        self.assertAlmostEqual(u, 1.3)
        self.assertAlmostEqual(v, 2.6)

    def test_zero_windage(self):
        u, v = combine_surface_velocity(
            current_u_ms=1.0,
            current_v_ms=2.0,
            wind_u_ms=10.0,
            wind_v_ms=20.0,
            windage_factor=0.0,
        )

        self.assertAlmostEqual(u, 1.0)
        self.assertAlmostEqual(v, 2.0)

    def test_negative_windage_rejected(self):
        with self.assertRaises(ValueError):
            combine_surface_velocity(
                current_u_ms=1.0,
                current_v_ms=2.0,
                wind_u_ms=10.0,
                wind_v_ms=20.0,
                windage_factor=-0.01,
            )


if __name__ == "__main__":
    unittest.main()
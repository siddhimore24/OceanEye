import unittest

from drift.metocean import CurrentField
from drift.wind import WindField
from drift.drift_simulator import (
    simulate_forward_drift,
    simulate_backward_drift,
    generate_backward_ensemble,
)


CURRENT_FILE = (
    "data/CASE_001/metocean/currents/"
    "fig3_vel_oil_drifter.nc"
)

WIND_FILE = (
    "data/CASE_001/metocean/wind/"
    "277b9c1e8c32745585f1bdf0bfe6199f.nc"
)


class TestDriftSimulator(unittest.TestCase):

    def test_forward_drift_with_real_data(self):
        current_field = CurrentField(CURRENT_FILE)
        wind_field = WindField(WIND_FILE)

        trajectory = simulate_forward_drift(
            start_latitude=25.0,
            start_longitude=-85.0,
            current_field=current_field,
            wind_field=wind_field,
            time_indices=[0, 1, 2],
            dt_seconds=3600.0,
            windage_factor=0.03,
        )

        self.assertEqual(len(trajectory), 4)

        print("\nDRIFT TRAJECTORY:")
        for position in trajectory:
            print(position)

        for position in trajectory:
            self.assertTrue(
                23.0 <= position["latitude"] <= 31.0
            )
            self.assertTrue(
                -90.0 <= position["longitude"] <= -81.0
            )

        current_field.close()
        wind_field.close()

    def test_backward_drift_with_real_data(self):
        current_field = CurrentField(CURRENT_FILE)
        wind_field = WindField(WIND_FILE)

        trajectory = simulate_backward_drift(
            start_latitude=25.0,
            start_longitude=-85.0,
            current_field=current_field,
            wind_field=wind_field,
            steps=1,
            dt_seconds=3600.0,
            windage_factor=0.03,
            start_time_index=1,
        )

        self.assertEqual(len(trajectory), 2)

        self.assertAlmostEqual(
            trajectory[0]["latitude"],
            25.0,
        )

        self.assertAlmostEqual(
            trajectory[0]["longitude"],
            -85.0,
        )

        self.assertNotEqual(
            trajectory[1]["latitude"],
            trajectory[0]["latitude"],
        )

        current_field.close()
        wind_field.close()

    def test_backward_ensemble_with_real_data(self):
        current_field = CurrentField(CURRENT_FILE)
        wind_field = WindField(WIND_FILE)

        source_positions = generate_backward_ensemble(
            start_latitude=25.0,
            start_longitude=-85.0,
            current_field=current_field,
            wind_field=wind_field,
            num_particles=20,
            position_uncertainty_deg=0.01,
            windage_min=0.02,
            windage_max=0.04,
            steps=2,
            dt_seconds=3600.0,
            start_time_index=2,
            random_seed=42,
        )

        self.assertEqual(len(source_positions), 20)

        for position in source_positions:
            self.assertTrue(
                23.0 <= position["latitude"] <= 31.0
            )
            self.assertTrue(
                -90.0 <= position["longitude"] <= -81.0
            )

            self.assertTrue(
                0.02 <= position["windage_factor"] <= 0.04
            )

        current_field.close()
        wind_field.close()


if __name__ == "__main__":
    unittest.main()
import unittest
from pathlib import Path

from drift.metocean import CurrentField


class TestCurrentField(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.data_file = (
            Path(__file__).parent.parent
            / "data"
            / "CASE_001"
            / "metocean"
            / "currents"
            / "fig3_vel_oil_drifter.nc"
        )

    def test_file_exists(self):
        self.assertTrue(self.data_file.exists())

    def test_current_field_loads(self):
        field = CurrentField(self.data_file)

        self.assertEqual(field.u.attrs.get("units"), "cm/s")
        self.assertEqual(field.v.attrs.get("units"), "cm/s")

        self.assertEqual(field.u.sizes["t"], 9)
        self.assertEqual(field.v.sizes["t"], 9)

        field.close()

    def test_coordinates(self):
        field = CurrentField(self.data_file)

        self.assertAlmostEqual(float(field.latitude.min()), 23.0)
        self.assertAlmostEqual(float(field.latitude.max()), 31.0)

        self.assertAlmostEqual(float(field.longitude.min()), -90.0)
        self.assertAlmostEqual(float(field.longitude.max()), -81.0)

        field.close()


if __name__ == "__main__":
    unittest.main()
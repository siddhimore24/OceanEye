import unittest

from drift.wind import WindField


WIND_FILE = (
    "data/CASE_001/metocean/wind/"
    "277b9c1e8c32745585f1bdf0bfe6199f.nc"
)


class TestWindField(unittest.TestCase):

    def test_file_exists(self):
        wind = WindField(WIND_FILE)
        self.assertTrue(wind.filepath.exists())
        wind.close()

    def test_wind_field_loads(self):
        wind = WindField(WIND_FILE)

        self.assertEqual(wind.ds.sizes["valid_time"], 4)
        self.assertEqual(wind.ds.sizes["latitude"], 33)
        self.assertEqual(wind.ds.sizes["longitude"], 37)

        wind.close()

    def test_get_wind(self):
        wind = WindField(WIND_FILE)

        u, v = wind.get_wind(
            latitude=25.0,
            longitude=-85.0,
            time_index=0
        )

        self.assertTrue(isinstance(u, float))
        self.assertTrue(isinstance(v, float))

        wind.close()


if __name__ == "__main__":
    unittest.main()
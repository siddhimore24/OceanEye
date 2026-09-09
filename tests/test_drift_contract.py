import json
import unittest
from pathlib import Path


SOURCE_ZONE_FILE = Path(
    "data/CASE_001/source_zone.geojson"
)


class TestDriftContract(unittest.TestCase):

    def test_source_zone_file_exists(self):
        self.assertTrue(
            SOURCE_ZONE_FILE.exists(),
            "Drift source-zone GeoJSON file does not exist.",
        )

    def test_required_drift_output_fields(self):
        with SOURCE_ZONE_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        properties = data["properties"]

        required_fields = [
            "spill_id",
            "release_time_window",
            "uncertainty",
        ]

        for field in required_fields:
            self.assertIn(
                field,
                properties,
                f"Missing Drift contract field: {field}",
            )

        self.assertIn(
            "geometry",
            data,
        )

    def test_spill_id_is_present(self):
        with SOURCE_ZONE_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        self.assertEqual(
            data["properties"]["spill_id"],
            "CASE_001",
        )

    def test_release_time_window_has_explicit_status(self):
        with SOURCE_ZONE_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        release_window = data[
            "properties"
        ]["release_time_window"]

        self.assertIn(
            "start",
            release_window,
        )

        self.assertIn(
            "end",
            release_window,
        )

        self.assertIn(
            "status",
            release_window,
        )

    def test_uncertainty_contains_required_information(self):
        with SOURCE_ZONE_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        uncertainty = data[
            "properties"
        ]["uncertainty"]

        self.assertIn(
            "position_uncertainty_deg",
            uncertainty,
        )

        self.assertIn(
            "windage_range",
            uncertainty,
        )

        self.assertIn(
            "num_particles",
            uncertainty,
        )

        self.assertIn(
            "probability_calibration",
            uncertainty,
        )


if __name__ == "__main__":
    unittest.main()
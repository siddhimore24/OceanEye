import unittest

from shapely.geometry import Polygon, MultiPolygon

from drift.source_zone import (
    calculate_source_density,
    extract_high_probability_zone,
    create_source_zone_polygon,
    source_zone_to_geojson,
)


class TestSourceZone(unittest.TestCase):

    def test_density_is_normalized(self):
        source_positions = [
            {"latitude": 25.0, "longitude": -85.0},
            {"latitude": 25.1, "longitude": -84.9},
            {"latitude": 25.2, "longitude": -84.8},
        ]

        result = calculate_source_density(
            source_positions,
            grid_size=10,
        )

        self.assertAlmostEqual(
            result["density"].sum(),
            1.0,
        )

    def test_density_contains_particles(self):
        source_positions = [
            {"latitude": 25.0, "longitude": -85.0},
            {"latitude": 25.1, "longitude": -84.9},
            {"latitude": 25.2, "longitude": -84.8},
        ]

        result = calculate_source_density(
            source_positions,
            grid_size=10,
        )

        self.assertGreater(
            result["density"].sum(),
            0,
        )

    def test_empty_positions_rejected(self):
        with self.assertRaises(ValueError):
            calculate_source_density(
                [],
                grid_size=10,
            )

    def test_high_probability_zone(self):
        source_positions = [
            {"latitude": 25.0, "longitude": -85.0},
            {"latitude": 25.01, "longitude": -84.99},
            {"latitude": 25.01, "longitude": -85.01},
            {"latitude": 25.02, "longitude": -85.0},
            {"latitude": 25.5, "longitude": -84.5},
        ]

        density_result = calculate_source_density(
            source_positions,
            grid_size=10,
        )

        zone = extract_high_probability_zone(
            density_result,
            threshold=0.5,
        )

        self.assertGreater(
            zone["selected_cells"],
            0,
        )

        self.assertEqual(
            zone["threshold"],
            0.5,
        )

        self.assertGreater(
            zone["max_density"],
            0,
        )

    def test_source_zone_polygon(self):
        source_positions = [
            {"latitude": 25.0, "longitude": -85.0},
            {"latitude": 25.01, "longitude": -84.99},
            {"latitude": 25.01, "longitude": -85.01},
            {"latitude": 25.02, "longitude": -85.0},
            {"latitude": 25.5, "longitude": -84.5},
        ]

        density_result = calculate_source_density(
            source_positions,
            grid_size=10,
        )

        polygon = create_source_zone_polygon(
            density_result,
            threshold=0.5,
        )

        self.assertTrue(
            isinstance(
                polygon,
                (Polygon, MultiPolygon),
            )
        )

        self.assertFalse(
            polygon.is_empty
        )

        self.assertGreater(
            polygon.area,
            0,
        )

        print("\nSOURCE ZONE POLYGON:")
        print(polygon)

    def test_source_zone_geojson(self):
        source_positions = [
            {"latitude": 25.0, "longitude": -85.0},
            {"latitude": 25.01, "longitude": -84.99},
            {"latitude": 25.01, "longitude": -85.01},
            {"latitude": 25.02, "longitude": -85.0},
            {"latitude": 25.5, "longitude": -84.5},
        ]

        density_result = calculate_source_density(
            source_positions,
            grid_size=10,
        )

        polygon = create_source_zone_polygon(
            density_result,
            threshold=0.5,
        )

        geojson = source_zone_to_geojson(
            polygon
        )

        self.assertIn(
            "type",
            geojson,
        )

        self.assertIn(
            "coordinates",
            geojson,
        )

        self.assertIn(
            geojson["type"],
            ["Polygon", "MultiPolygon"],
        )

        self.assertGreater(
            len(geojson["coordinates"]),
            0,
        )

        print("\nSOURCE ZONE GEOJSON:")
        print(geojson)


if __name__ == "__main__":
    unittest.main()
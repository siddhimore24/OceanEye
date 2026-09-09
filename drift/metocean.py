from pathlib import Path

import numpy as np
import xarray as xr


class CurrentField:
    """Load and validate a gridded ocean-current NetCDF dataset."""

    def __init__(self, filepath):
        self.filepath = Path(filepath)

        if not self.filepath.exists():
            raise FileNotFoundError(
                f"Current dataset not found: {self.filepath}"
            )

        self.dataset = xr.open_dataset(self.filepath)

        # ----------------------------------------------------
        # Required variables
        # ----------------------------------------------------

        for variable in ("u", "v"):
            if variable not in self.dataset:
                raise ValueError(
                    f"Required variable '{variable}' not found "
                    "in dataset."
                )

        self.u = self.dataset["u"]
        self.v = self.dataset["v"]

        # ----------------------------------------------------
        # Validate units
        # ----------------------------------------------------

        u_units = self.u.attrs.get("units")
        v_units = self.v.attrs.get("units")

        if u_units != "cm/s" or v_units != "cm/s":
            raise ValueError(
                f"Expected U/V units to be cm/s, "
                f"but found U={u_units}, V={v_units}."
            )

        # ----------------------------------------------------
        # Convert cm/s → m/s
        # ----------------------------------------------------

        self.u_ms = self.u / 100.0
        self.v_ms = self.v / 100.0

        # ----------------------------------------------------
        # Coordinates
        # ----------------------------------------------------

        self.longitude = self.dataset["lonuv"]
        self.latitude = self.dataset["latuv"]

        # Keep the original dataset time coordinate.
        #
        # IMPORTANT:
        # This CASE_001 current dataset contains numerical
        # time indices rather than absolute timestamps.
        # We therefore do NOT invent dates or times here.
        self.time = self.dataset["t"]

        self.time_values = np.asarray(
            self.time.values
        )

        # Explicitly record whether the time coordinate
        # contains usable datetime information.
        self.has_absolute_time = np.issubdtype(
            self.time.dtype,
            np.datetime64,
        )

    # ========================================================
    # DATASET SUMMARY
    # ========================================================

    def summary(self):
        """Return basic information about the current field."""

        return {
            "file": str(self.filepath),

            "u_units_original":
                self.u.attrs.get("units"),

            "v_units_original":
                self.v.attrs.get("units"),

            "u_units_model":
                "m/s",

            "v_units_model":
                "m/s",

            "time_steps":
                self.u.sizes["t"],

            "time_values":
                self.time_values.tolist(),

            "has_absolute_time":
                self.has_absolute_time,

            "latitude_range": (
                float(self.latitude.min()),
                float(self.latitude.max()),
            ),

            "longitude_range": (
                float(self.longitude.min()),
                float(self.longitude.max()),
            ),

            "u_nan_count":
                int(np.isnan(self.u.values).sum()),

            "v_nan_count":
                int(np.isnan(self.v.values).sum()),
        }

    # ========================================================
    # TIME INFORMATION
    # ========================================================

    def get_time_value(self, time_index):
        """
        Return the original time-coordinate value for a
        current-field time index.

        This method does NOT convert numerical dataset
        indices into timestamps.
        """

        if (
            time_index < 0
            or time_index >= len(self.time_values)
        ):
            raise IndexError(
                "Time index is outside the current dataset."
            )

        return self.time_values[time_index]

    # ========================================================
    # CURRENT LOOKUP
    # ========================================================

    def get_current(
        self,
        latitude,
        longitude,
        time_index=0,
    ):
        """Return ocean current at the nearest valid grid cell."""

        if (
            time_index < 0
            or time_index >= len(self.time)
        ):
            raise IndexError(
                "Time index is outside the current dataset."
            )

        # ----------------------------------------------------
        # Geographic bounds
        # ----------------------------------------------------

        if (
            latitude < self.latitude.min()
            or latitude > self.latitude.max()
        ):
            raise ValueError(
                "Latitude is outside the current-field domain."
            )

        if (
            longitude < self.longitude.min()
            or longitude > self.longitude.max()
        ):
            raise ValueError(
                "Longitude is outside the current-field domain."
            )

        # ----------------------------------------------------
        # Find nearest grid cell
        # ----------------------------------------------------

        latitudes = np.asarray(
            self.dataset["latuv"].values
        )

        longitudes = np.asarray(
            self.dataset["lonuv"].values
        )

        lat_index = int(
            np.abs(
                latitudes - latitude
            ).argmin()
        )

        lon_index = int(
            np.abs(
                longitudes - longitude
            ).argmin()
        )

        # ----------------------------------------------------
        # Read current
        # ----------------------------------------------------

        u_value = self.u_ms.isel(
            t=time_index,
            yuv=lat_index,
            xuv=lon_index,
        ).item()

        v_value = self.v_ms.isel(
            t=time_index,
            yuv=lat_index,
            xuv=lon_index,
        ).item()

        # ----------------------------------------------------
        # Check for masked/invalid cells
        # ----------------------------------------------------

        if (
            not np.isfinite(u_value)
            or not np.isfinite(v_value)
        ):
            raise ValueError(
                "The requested location is inside an "
                "invalid/masked current-grid cell."
            )

        return float(u_value), float(v_value)

    # ========================================================
    # CLOSE DATASET
    # ========================================================

    def close(self):
        """Close the underlying NetCDF dataset."""

        self.dataset.close()
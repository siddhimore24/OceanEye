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

        # Required variables
        for variable in ("u", "v"):
            if variable not in self.dataset:
                raise ValueError(
                    f"Required variable '{variable}' not found in dataset."
                )

        self.u = self.dataset["u"]
        self.v = self.dataset["v"]

        # Validate units
        u_units = self.u.attrs.get("units")
        v_units = self.v.attrs.get("units")

        if u_units != "cm/s" or v_units != "cm/s":
            raise ValueError(
                f"Expected U/V units to be cm/s, "
                f"but found U={u_units}, V={v_units}."
            )

        # Convert cm/s → m/s for physical calculations
        self.u_ms = self.u / 100.0
        self.v_ms = self.v / 100.0

        # Coordinates
        self.longitude = self.dataset["lonuv"]
        self.latitude = self.dataset["latuv"]
        self.time = self.dataset["t"]

    def summary(self):
        """Return basic information about the current field."""
        return {
            "file": str(self.filepath),
            "u_units_original": self.u.attrs.get("units"),
            "v_units_original": self.v.attrs.get("units"),
            "u_units_model": "m/s",
            "v_units_model": "m/s",
            "time_steps": self.u.sizes["t"],
            "latitude_range": (
                float(self.latitude.min()),
                float(self.latitude.max()),
            ),
            "longitude_range": (
                float(self.longitude.min()),
                float(self.longitude.max()),
            ),
            "u_nan_count": int(np.isnan(self.u.values).sum()),
            "v_nan_count": int(np.isnan(self.v.values).sum()),
               }


    def get_current(self, latitude, longitude, time_index=0):
        """Return ocean current at the nearest valid grid cell."""

        if time_index < 0 or time_index >= len(self.time):

         if latitude < self.latitude.min() or latitude > self.latitude.max():
            raise ValueError("Latitude is outside the current-field domain.")

        if longitude < self.longitude.min() or longitude > self.longitude.max():
            raise ValueError("Longitude is outside the current-field domain.")

        # Dataset stores latitude/longitude as 1D arrays,
        # while U/V use yuv/xuv dimensions.
        latitudes = np.asarray(self.dataset["latuv"].values)
        longitudes = np.asarray(self.dataset["lonuv"].values)

        # Find nearest grid cell.
        lat_index = int(np.abs(latitudes - latitude).argmin())
        lon_index = int(np.abs(longitudes - longitude).argmin())

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

        if not np.isfinite(u_value) or not np.isfinite(v_value):
            raise ValueError(
                "The requested location is inside an invalid/masked "
                "current-grid cell."
            )

        return float(u_value), float(v_value)
    def close(self):
        """Close the underlying NetCDF dataset."""
        self.dataset.close()
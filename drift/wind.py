from pathlib import Path

import numpy as np
import xarray as xr


class WindField:
    """Load and validate a gridded ERA5 10 m wind NetCDF dataset."""

    def __init__(self, filepath):
        self.filepath = Path(filepath)

        if not self.filepath.exists():
            raise FileNotFoundError(
                f"Wind dataset not found: {self.filepath}"
            )

        self.ds = xr.open_dataset(self.filepath)

        # Validate required variables
        required_variables = {"u10", "v10"}
        missing = required_variables - set(self.ds.data_vars)

        if missing:
            raise ValueError(
                f"Missing required wind variables: {sorted(missing)}"
            )

        # Store coordinates
        self.time = self.ds["valid_time"]
        self.latitude = self.ds["latitude"]
        self.longitude = self.ds["longitude"]

        # Validate wind units
        u_units = self.ds["u10"].attrs.get("units")
        v_units = self.ds["v10"].attrs.get("units")

        if u_units != "m s**-1" or v_units != "m s**-1":
            raise ValueError(
                f"Expected wind units of m s**-1, "
                f"got u10={u_units}, v10={v_units}"
            )

        # Wind is already in m/s
        self.u_ms = self.ds["u10"]
        self.v_ms = self.ds["v10"]

    def summary(self):
        """Return basic information about the wind dataset."""
        return {
            "file": str(self.filepath),
            "variables": ["u10", "v10"],
            "units": "m/s",
            "time_steps": int(self.ds.sizes["valid_time"]),
            "latitude_range": (
                float(self.latitude.min()),
                float(self.latitude.max()),
            ),
            "longitude_range": (
                float(self.longitude.min()),
                float(self.longitude.max()),
            ),
            "u10_nan_count": int(self.u_ms.isnull().sum()),
            "v10_nan_count": int(self.v_ms.isnull().sum()),
        }

    def get_wind(self, latitude, longitude, time_index=0):
        """
        Get the nearest 10 m wind components.

        Returns:
            (u_ms, v_ms) in metres per second.
        """

        if time_index < 0 or time_index >= self.ds.sizes["valid_time"]:
            raise IndexError(
                f"time_index must be between 0 and "
                f"{self.ds.sizes['valid_time'] - 1}"
            )

        # Find nearest grid point
        lat_index = int(
            np.abs(self.latitude.values - latitude).argmin()
        )

        lon_index = int(
            np.abs(self.longitude.values - longitude).argmin()
        )

        u_value = float(
            self.u_ms.isel(
                valid_time=time_index,
                latitude=lat_index,
                longitude=lon_index,
            ).values
        )

        v_value = float(
            self.v_ms.isel(
                valid_time=time_index,
                latitude=lat_index,
                longitude=lon_index,
            ).values
        )

        if not np.isfinite(u_value) or not np.isfinite(v_value):
            raise ValueError(
                "Wind data is unavailable at the selected location."
            )

        return u_value, v_value

    def close(self):
        """Close the NetCDF dataset."""
        self.ds.close()
export async function requestLocationPermission(): Promise<PermissionState | "unknown"> {
  if (!navigator.permissions || !navigator.geolocation) {
    return "unknown";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state === "prompt") {
      // Trigger the prompt by requesting location
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve("granted"),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) resolve("denied");
            else resolve("prompt");
          },
          { timeout: 10000, maximumAge: 0 }
        );
      });
    }
    return status.state;
  } catch {
    return "unknown";
  }
}

export async function getLocationPermissionState(): Promise<PermissionState | "unknown"> {
  if (!navigator.permissions) return "unknown";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unknown";
  }
}

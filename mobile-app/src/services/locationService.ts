import * as Location from 'expo-location';

// Office Coordinates
const OFFICE_LAT = 28.5755;
const OFFICE_LON = 77.2274;
const ALLOWED_RADIUS_METERS = 100;

// Haversine formula to calculate the distance between two lat/lon points in meters
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in meters
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export type GeofenceResult = {
  isAllowed: boolean;
  distance: number;
  error?: string;
  location?: Location.LocationObject;
};

export async function checkGeofence(): Promise<GeofenceResult> {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { isAllowed: false, distance: 0, error: 'Permission to access location was denied' };
    }

    // Get current position
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    const currentLat = location.coords.latitude;
    const currentLon = location.coords.longitude;

    const distance = getDistanceFromLatLonInMeters(
      currentLat, currentLon, OFFICE_LAT, OFFICE_LON
    );

    const isAllowed = distance <= ALLOWED_RADIUS_METERS;

    return {
      isAllowed,
      distance: Math.round(distance),
      location
    };
  } catch (err: any) {
    return { isAllowed: false, distance: 0, error: err.message || 'Failed to fetch location' };
  }
}

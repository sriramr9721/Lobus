import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Requests every runtime permission BLE scanning + advertising needs on
 * Android. Must be called (and granted) before starting a scan or
 * advertising — otherwise scans silently return zero results.
 *
 * Android 12+ (API 31+) uses the new BLUETOOTH_SCAN / BLUETOOTH_CONNECT /
 * BLUETOOTH_ADVERTISE runtime permissions.
 * Android <12 needs ACCESS_FINE_LOCATION instead, because BLE scan results
 * were historically tied to location permission.
 */
export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // iOS handles BLE permission prompts automatically via Info.plist usage
    // descriptions the first time the APIs are touched.
    return true;
  }

  const apiLevel = Platform.Version as number;

  if (apiLevel >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    ]);

    return (
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

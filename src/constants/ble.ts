/**
 * Every Lobus node advertises this same service + characteristic.
 * Central devices scan specifically for SERVICE_UUID so they only
 * see other Lobus nodes, not every random BLE device nearby.
 *
 * Do not change these once two phones need to talk to each other —
 * both sides must use the exact same UUIDs.
 */
export const SERVICE_UUID = 'ca10229d-261c-4588-9407-82ef20afe646';
export const CHARACTERISTIC_UUID = '925c39be-af51-4df4-8315-bbe3ce2e23c5';

/** Name advertised to other nodes during BLE discovery. */
export const ADVERTISED_NAME = 'LOBUS_NODE';

/** react-native-bluetooth-client permission/property bit flags (Android). */
export const GattPermission = {
  WRITE: 16,
} as const;

export const GattProperty = {
  WRITE: 8,
} as const;

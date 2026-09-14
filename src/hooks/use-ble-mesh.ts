import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { BleManager, type Device } from 'react-native-ble-plx';
import {
  addCharacteristicToService,
  addService,
  checkBluetooth,
  enableBluetooth,
  setName,
  startAdvertising,
  stopAdvertising,
} from 'react-native-bluetooth-client';
import { bytesToString } from 'convert-string';
import { decode as base64Decode, encode as base64Encode } from 'base-64';

import {
  ADVERTISED_NAME,
  CHARACTERISTIC_UUID,
  GattPermission,
  GattProperty,
  SERVICE_UUID,
} from '@/constants/ble';
import { requestBlePermissions } from '@/lib/ble-permissions';

export type DiscoveredNode = {
  id: string;
  name: string | null;
  rssi: number | null;
};

export type ReceivedMessage = {
  id: string;
  text: string;
  receivedAt: number;
};

/**
 * Phase 2 test hook: every phone using this hook simultaneously
 * - advertises itself as a Lobus node (peripheral / GATT server), and
 * - scans for other Lobus nodes (central) and can write "hello" to them.
 *
 * This is intentionally minimal — no retry logic, no message queue, no
 * reconnect handling. The only goal is proving two phones can exchange
 * one message reliably before Phase 3+ builds on top of this.
 */
export function useBleMesh() {
  const managerRef = useRef<BleManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState<DiscoveredNode[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<ReceivedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ---- Peripheral setup (advertise + GATT server) ----------------------
  useEffect(() => {
    let receiveListener: { remove: () => void } | undefined;

    async function setupPeripheral() {
  try {
    const granted = await requestBlePermissions();
    if (!granted) {
      setError('Bluetooth permissions were not granted.');
      return;
    }

    await checkBluetooth();
    if (Platform.OS === 'android') {
      await enableBluetooth();
    }

        setName(ADVERTISED_NAME);
        addService(SERVICE_UUID, true);
        addCharacteristicToService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          GattPermission.WRITE,
          GattProperty.WRITE,
          '',
        );

        const BluetoothClientModule = NativeModules.BluetoothClient;
        const emitter = new NativeEventEmitter(BluetoothClientModule);
        receiveListener = emitter.addListener('onReceiveData', (event: { data: number[] }) => {
          const text = bytesToString(event.data);
          setReceivedMessages((prev) => [
            { id: `${Date.now()}-${prev.length}`, text, receivedAt: Date.now() },
            ...prev,
          ]);
        });

        // 0 = advertise indefinitely instead of the default 3-minute cutoff.
        await startAdvertising(0);
        setIsAdvertising(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start advertising');
      }
    }

    setupPeripheral();

    return () => {
      receiveListener?.remove();
      stopAdvertising().catch(() => {
        // Best-effort cleanup — nothing to do if this fails on unmount.
      });
    };
  }, []);

  // ---- Central setup (scan + connect + write) ---------------------------
  useEffect(() => {
    const manager = new BleManager();
    managerRef.current = manager;
    setIsReady(true);

    return () => {
      manager.stopDeviceScan();
      manager.destroy();
      managerRef.current = null;
    };
  }, []);

  const startScan = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) return;

    const granted = await requestBlePermissions();
    if (!granted) {
      setError('Bluetooth permissions were not granted.');
      return;
    }

    setDiscoveredNodes([]);
    setIsScanning(true);

    manager.startDeviceScan([SERVICE_UUID], null, (scanError, device) => {
      if (scanError) {
        setError(scanError.message);
        setIsScanning(false);
        return;
      }
      if (!device) return;

      setDiscoveredNodes((prev) => {
        if (prev.some((node) => node.id === device.id)) return prev;
        return [...prev, { id: device.id, name: device.name, rssi: device.rssi }];
      });
    });
  }, []);

  const stopScan = useCallback(() => {
    managerRef.current?.stopDeviceScan();
    setIsScanning(false);
  }, []);

  const sendHello = useCallback(async (deviceId: string) => {
    const manager = managerRef.current;
    if (!manager) return;

    let device: Device | null = null;
    try {
      device = await manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      const payload = base64Encode(`hello from ${ADVERTISED_NAME}`);
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        payload,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send hello');
    } finally {
      if (device) {
        await device.cancelConnection().catch(() => {});
      }
    }
  }, []);

  return {
    isReady,
    isScanning,
    isAdvertising,
    discoveredNodes,
    receivedMessages,
    error,
    startScan,
    stopScan,
    sendHello,
  };
}

// base64Decode is exported for symmetry / future use (e.g. decoding
// responses read back from a characteristic) even though the current
// Phase 2 flow only needs base64Encode for outgoing writes.
export { base64Decode };

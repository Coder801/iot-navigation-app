import { useCallback, useEffect, useReducer, useRef } from 'react';
import { BleManager, Device, State, Subscription } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

import { useBluetoothPermissions } from '@/hooks/use-bluetooth-permissions';
import {
  BLE_UUIDS,
  BLUETOOTH_CONFIG,
  BLUETOOTH_ERRORS,
} from '@/constants/bluetooth';
import type {
  BluetoothState,
  BluetoothDeviceInfo,
  UseBluetoothReturn,
} from '@/services/bluetooth/types';

type BluetoothAction =
  | { type: 'SET_ADAPTER_STATE'; payload: BluetoothState['adapterState'] }
  | { type: 'SET_SCANNING'; payload: boolean }
  | { type: 'SET_DISCOVERED_DEVICES'; payload: BluetoothDeviceInfo[] }
  | { type: 'ADD_DISCOVERED_DEVICE'; payload: BluetoothDeviceInfo }
  | { type: 'SET_PAIRED_DEVICES'; payload: BluetoothDeviceInfo[] }
  | { type: 'SET_CONNECTED_DEVICE'; payload: BluetoothDeviceInfo | null }
  | { type: 'SET_CONNECTION_STATE'; payload: BluetoothState['connectionState'] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_RECEIVED_DATA'; payload: string }
  | { type: 'CLEAR_RECEIVED_DATA' };

interface ExtendedState extends BluetoothState {
  receivedData: string[];
}

const initialState: ExtendedState = {
  adapterState: 'unknown',
  isScanning: false,
  discoveredDevices: [],
  pairedDevices: [], // Not used in BLE, kept for interface compatibility
  connectedDevice: null,
  connectionState: 'disconnected',
  error: null,
  receivedData: [],
};

function bluetoothReducer(
  state: ExtendedState,
  action: BluetoothAction
): ExtendedState {
  switch (action.type) {
    case 'SET_ADAPTER_STATE':
      return { ...state, adapterState: action.payload };
    case 'SET_SCANNING':
      return { ...state, isScanning: action.payload };
    case 'SET_DISCOVERED_DEVICES':
      return { ...state, discoveredDevices: action.payload };
    case 'ADD_DISCOVERED_DEVICE':
      if (
        state.discoveredDevices.some((d) => d.address === action.payload.address)
      ) {
        return state;
      }
      return {
        ...state,
        discoveredDevices: [...state.discoveredDevices, action.payload],
      };
    case 'SET_PAIRED_DEVICES':
      return { ...state, pairedDevices: action.payload };
    case 'SET_CONNECTED_DEVICE':
      return { ...state, connectedDevice: action.payload };
    case 'SET_CONNECTION_STATE':
      return { ...state, connectionState: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_RECEIVED_DATA': {
      const newData = [...state.receivedData, action.payload];
      if (newData.length > BLUETOOTH_CONFIG.MAX_RECEIVED_MESSAGES) {
        newData.shift();
      }
      return { ...state, receivedData: newData };
    }
    case 'CLEAR_RECEIVED_DATA':
      return { ...state, receivedData: [] };
    default:
      return state;
  }
}

// Singleton BleManager instance
let bleManagerInstance: BleManager | null = null;

function getBleManager(): BleManager {
  if (!bleManagerInstance) {
    bleManagerInstance = new BleManager();
  }
  return bleManagerInstance;
}

function toDeviceInfo(device: Device): BluetoothDeviceInfo {
  return {
    id: device.id,
    name: device.name || device.localName || 'Unknown Device',
    address: device.id,
    rssi: device.rssi ?? undefined,
  };
}

function mapBleState(state: State): BluetoothState['adapterState'] {
  switch (state) {
    case State.PoweredOn:
      return 'enabled';
    case State.PoweredOff:
      return 'disabled';
    case State.Unsupported:
      return 'unavailable';
    case State.Unknown:
    case State.Resetting:
    default:
      return 'unknown';
  }
}

export function useBluetooth(): UseBluetoothReturn {
  const [state, dispatch] = useReducer(bluetoothReducer, initialState);
  const { granted: permissionsGranted, checkPermissions } =
    useBluetoothPermissions();

  const bleManager = useRef<BleManager>(getBleManager());
  const connectedDeviceRef = useRef<Device | null>(null);
  const subscriptionsRef = useRef<Subscription[]>([]);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const bleState = await bleManager.current.state();
      const adapterState = mapBleState(bleState);
      dispatch({ type: 'SET_ADAPTER_STATE', payload: adapterState });
      return adapterState === 'enabled';
    } catch {
      dispatch({ type: 'SET_ADAPTER_STATE', payload: 'unavailable' });
      return false;
    }
  }, []);

  const enableBluetooth = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'android') {
      try {
        await bleManager.current.enable();
        dispatch({ type: 'SET_ADAPTER_STATE', payload: 'enabled' });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: BLUETOOTH_ERRORS.NOT_ENABLED });
      }
    } else {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Enable Bluetooth manually in Settings',
      });
    }
  }, []);

  const openSettings = useCallback(async (): Promise<void> => {
    // BLE library doesn't have direct settings opening, handled via permissions hook
  }, []);

  const getPairedDevices = useCallback(async (): Promise<BluetoothDeviceInfo[]> => {
    // BLE doesn't have "paired devices" concept like Classic Bluetooth
    // Return empty array for interface compatibility
    return [];
  }, []);

  const stopScan = useCallback(async (): Promise<void> => {
    try {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      bleManager.current.stopDeviceScan();
      dispatch({ type: 'SET_SCANNING', payload: false });
    } catch (error) {
      console.error('Failed to stop scan:', error);
      dispatch({ type: 'SET_SCANNING', payload: false });
    }
  }, []);

  const startScan = useCallback(async (): Promise<void> => {
    if (!permissionsGranted) {
      const granted = await checkPermissions();
      if (!granted) {
        dispatch({ type: 'SET_ERROR', payload: BLUETOOTH_ERRORS.PERMISSION_DENIED });
        return;
      }
    }

    try {
      dispatch({ type: 'SET_DISCOVERED_DEVICES', payload: [] });
      dispatch({ type: 'SET_SCANNING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Scan for devices with NUS service, or all devices if you want to see everything
      bleManager.current.startDeviceScan(
        null, // null = scan all devices, or [BLE_UUIDS.NUS_SERVICE] to filter
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            dispatch({ type: 'SET_ERROR', payload: BLUETOOTH_ERRORS.SCAN_FAILED });
            dispatch({ type: 'SET_SCANNING', payload: false });
            return;
          }

          if (device && device.name) {
            dispatch({ type: 'ADD_DISCOVERED_DEVICE', payload: toDeviceInfo(device) });
          }
        }
      );

      scanTimeoutRef.current = setTimeout(() => {
        stopScan();
      }, BLUETOOTH_CONFIG.SCAN_DURATION);
    } catch {
      dispatch({ type: 'SET_SCANNING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: BLUETOOTH_ERRORS.SCAN_FAILED });
    }
  }, [permissionsGranted, checkPermissions, stopScan]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnecting' });

      subscriptionsRef.current.forEach((sub) => sub.remove());
      subscriptionsRef.current = [];

      if (connectedDeviceRef.current) {
        await bleManager.current.cancelDeviceConnection(
          connectedDeviceRef.current.id
        );
      }

      connectedDeviceRef.current = null;
      dispatch({ type: 'SET_CONNECTED_DEVICE', payload: null });
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnected' });
      dispatch({ type: 'CLEAR_RECEIVED_DATA' });
    } catch {
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnected' });
      dispatch({ type: 'SET_ERROR', payload: BLUETOOTH_ERRORS.DISCONNECTION_FAILED });
    }
  }, []);

  const connect = useCallback(
    async (device: BluetoothDeviceInfo): Promise<void> => {
      try {
        dispatch({ type: 'SET_CONNECTION_STATE', payload: 'connecting' });
        dispatch({ type: 'SET_ERROR', payload: null });

        if (state.isScanning) {
          await stopScan();
        }

        // Connect to device
        const connectedDevice = await bleManager.current.connectToDevice(
          device.address,
          { timeout: BLUETOOTH_CONFIG.CONNECTION_TIMEOUT }
        );

        // Discover services and characteristics
        await connectedDevice.discoverAllServicesAndCharacteristics();

        // Verify NUS service exists
        const services = await connectedDevice.services();
        const nusService = services.find(
          (s) => s.uuid.toLowerCase() === BLE_UUIDS.NUS_SERVICE.toLowerCase()
        );

        if (!nusService) {
          await bleManager.current.cancelDeviceConnection(device.address);
          throw new Error(BLUETOOTH_ERRORS.SERVICE_NOT_FOUND);
        }

        connectedDeviceRef.current = connectedDevice;
        dispatch({ type: 'SET_CONNECTED_DEVICE', payload: device });
        dispatch({ type: 'SET_CONNECTION_STATE', payload: 'connected' });

        // Subscribe to RX characteristic for incoming data
        const dataSubscription = connectedDevice.monitorCharacteristicForService(
          BLE_UUIDS.NUS_SERVICE,
          BLE_UUIDS.NUS_RX_CHARACTERISTIC,
          (error, characteristic) => {
            if (error) {
              console.error('Data receive error:', error);
              return;
            }

            if (characteristic?.value) {
              const decodedData = Buffer.from(characteristic.value, 'base64').toString('utf-8');
              dispatch({ type: 'ADD_RECEIVED_DATA', payload: decodedData });
            }
          }
        );

        subscriptionsRef.current.push(dataSubscription);

        // Monitor disconnection
        const disconnectSubscription = bleManager.current.onDeviceDisconnected(
          device.address,
          () => {
            connectedDeviceRef.current = null;
            dispatch({ type: 'SET_CONNECTED_DEVICE', payload: null });
            dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnected' });
          }
        );

        subscriptionsRef.current.push(disconnectSubscription);
      } catch (error) {
        connectedDeviceRef.current = null;
        dispatch({ type: 'SET_CONNECTED_DEVICE', payload: null });
        dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnected' });
        dispatch({
          type: 'SET_ERROR',
          payload:
            error instanceof Error
              ? error.message
              : BLUETOOTH_ERRORS.CONNECTION_FAILED,
        });
      }
    },
    [state.isScanning, stopScan]
  );

  const sendData = useCallback(async (data: string): Promise<void> => {
    if (!connectedDeviceRef.current) {
      dispatch({ type: 'SET_ERROR', payload: 'No device connected' });
      return;
    }

    try {
      const encodedData = Buffer.from(data, 'utf-8').toString('base64');
      await connectedDeviceRef.current.writeCharacteristicWithResponseForService(
        BLE_UUIDS.NUS_SERVICE,
        BLE_UUIDS.NUS_TX_CHARACTERISTIC,
        encodedData
      );
    } catch {
      dispatch({ type: 'SET_ERROR', payload: BLUETOOTH_ERRORS.SEND_FAILED });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  useEffect(() => {
    const setupListeners = async () => {
      await checkAvailability();

      const stateSubscription = bleManager.current.onStateChange((bleState) => {
        dispatch({ type: 'SET_ADAPTER_STATE', payload: mapBleState(bleState) });
      }, true);

      subscriptionsRef.current.push(stateSubscription);
    };

    setupListeners();

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.remove());
      subscriptionsRef.current = [];

      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [checkAvailability]);

  return {
    adapterState: state.adapterState,
    isScanning: state.isScanning,
    discoveredDevices: state.discoveredDevices,
    pairedDevices: state.pairedDevices,
    connectedDevice: state.connectedDevice,
    connectionState: state.connectionState,
    error: state.error,
    receivedData: state.receivedData,
    checkAvailability,
    enableBluetooth,
    openSettings,
    startScan,
    stopScan,
    getPairedDevices,
    connect,
    disconnect,
    sendData,
    clearError,
  };
}

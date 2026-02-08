export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  address: string;
  rssi?: number;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting';

export type BluetoothAdapterState =
  | 'unknown'
  | 'unavailable'
  | 'disabled'
  | 'enabled';

export interface BluetoothState {
  adapterState: BluetoothAdapterState;
  isScanning: boolean;
  discoveredDevices: BluetoothDeviceInfo[];
  pairedDevices: BluetoothDeviceInfo[];
  connectedDevice: BluetoothDeviceInfo | null;
  connectionState: ConnectionState;
  error: string | null;
}

export interface BluetoothActions {
  checkAvailability: () => Promise<boolean>;
  enableBluetooth: () => Promise<void>;
  openSettings: () => Promise<void>;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  getPairedDevices: () => Promise<BluetoothDeviceInfo[]>;
  connect: (device: BluetoothDeviceInfo) => Promise<void>;
  disconnect: () => Promise<void>;
  sendData: (data: string) => Promise<void>;
  clearError: () => void;
}

export interface UseBluetoothReturn extends BluetoothState, BluetoothActions {
  receivedData: string[];
}

// Nordic UART Service UUIDs (standard for ESP32/Arduino BLE)
export const BLE_UUIDS = {
  NUS_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  NUS_TX_CHARACTERISTIC: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Write to device
  NUS_RX_CHARACTERISTIC: '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // Read/Notify from device
} as const;

export const BLUETOOTH_CONFIG = {
  SCAN_DURATION: 12000,
  CONNECTION_TIMEOUT: 10000,
  MAX_RECEIVED_MESSAGES: 100,
} as const;

export const BLUETOOTH_ERRORS = {
  NOT_AVAILABLE: 'Bluetooth is not available on this device',
  NOT_ENABLED: 'Bluetooth is not enabled',
  SCAN_FAILED: 'Failed to start device scan',
  CONNECTION_FAILED: 'Failed to connect to device',
  DISCONNECTION_FAILED: 'Failed to disconnect from device',
  SEND_FAILED: 'Failed to send data',
  PERMISSION_DENIED: 'Bluetooth permission denied',
  SERVICE_NOT_FOUND: 'UART service not found on device',
} as const;

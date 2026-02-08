import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  ConnectionStatus,
  DeviceList,
  DataTerminal,
} from '@/components/bluetooth';
import { useBluetooth } from '@/hooks/use-bluetooth';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { BluetoothDeviceInfo } from '@/services/bluetooth/types';

export default function BluetoothScreen() {
  const [activeTab, setActiveTab] = useState<'devices' | 'terminal'>('devices');
  const tintColor = useThemeColor({}, 'tint');

  const {
    adapterState,
    isScanning,
    discoveredDevices,
    connectedDevice,
    connectionState,
    error,
    receivedData,
    startScan,
    stopScan,
    connect,
    disconnect,
    sendData,
    enableBluetooth,
    clearError,
  } = useBluetooth();

  useEffect(() => {
    if (error) {
      Alert.alert('Bluetooth Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleDevicePress = useCallback(
    async (device: BluetoothDeviceInfo) => {
      if (connectedDevice?.address === device.address) {
        Alert.alert('Disconnect', `Disconnect from ${device.name}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: disconnect },
        ]);
      } else {
        await connect(device);
      }
    },
    [connectedDevice, connect, disconnect]
  );

  const handleScan = useCallback(async () => {
    if (isScanning) {
      await stopScan();
    } else {
      await startScan();
    }
  }, [isScanning, startScan, stopScan]);

  const isBluetoothReady = adapterState === 'enabled';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Bluetooth</ThemedText>
      </View>

      <ConnectionStatus
        adapterState={adapterState}
        connectionState={connectionState}
        connectedDeviceName={connectedDevice?.name}
      />

      {!isBluetoothReady && adapterState === 'disabled' && (
        <TouchableOpacity
          style={[styles.enableButton, { backgroundColor: tintColor }]}
          onPress={enableBluetooth}
        >
          <ThemedText style={styles.enableButtonText}>
            Enable Bluetooth
          </ThemedText>
        </TouchableOpacity>
      )}

      {isBluetoothReady && (
        <>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'devices' && { borderBottomColor: tintColor },
              ]}
              onPress={() => setActiveTab('devices')}
            >
              <ThemedText
                type={activeTab === 'devices' ? 'defaultSemiBold' : 'default'}
              >
                Devices
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'terminal' && { borderBottomColor: tintColor },
              ]}
              onPress={() => setActiveTab('terminal')}
            >
              <ThemedText
                type={activeTab === 'terminal' ? 'defaultSemiBold' : 'default'}
              >
                Terminal
              </ThemedText>
            </TouchableOpacity>
          </View>

          {activeTab === 'devices' ? (
            <ScrollView style={styles.content}>
              <TouchableOpacity
                style={[styles.scanButton, { borderColor: tintColor }]}
                onPress={handleScan}
              >
                <ThemedText style={{ color: tintColor }}>
                  {isScanning ? 'Stop Scanning' : 'Scan for Devices'}
                </ThemedText>
              </TouchableOpacity>

              <DeviceList
                title="Discovered Devices"
                devices={discoveredDevices}
                onDevicePress={handleDevicePress}
                connectedDeviceId={connectedDevice?.address}
                emptyMessage={
                  isScanning ? 'Scanning...' : 'No devices discovered'
                }
              />
            </ScrollView>
          ) : (
            <DataTerminal
              receivedData={receivedData}
              onSend={sendData}
              isConnected={connectionState === 'connected'}
            />
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  enableButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  scanButton: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
});

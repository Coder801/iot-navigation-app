import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type {
  BluetoothAdapterState,
  ConnectionState,
} from '@/services/bluetooth/types';

interface ConnectionStatusProps {
  adapterState: BluetoothAdapterState;
  connectionState: ConnectionState;
  connectedDeviceName?: string | null;
}

export function ConnectionStatus({
  adapterState,
  connectionState,
  connectedDeviceName,
}: ConnectionStatusProps) {
  const tintColor = useThemeColor({}, 'tint');

  const getStatusColor = () => {
    if (adapterState !== 'enabled') return '#ff6b6b';
    if (connectionState === 'connected') return '#51cf66';
    if (
      connectionState === 'connecting' ||
      connectionState === 'disconnecting'
    )
      return '#ffd43b';
    return '#868e96';
  };

  const getStatusText = () => {
    if (adapterState === 'unavailable') return 'Bluetooth Unavailable';
    if (adapterState === 'disabled') return 'Bluetooth Disabled';
    if (adapterState === 'unknown') return 'Checking Bluetooth...';

    switch (connectionState) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return `Connected to ${connectedDeviceName || 'Device'}`;
      case 'disconnecting':
        return 'Disconnecting...';
      default:
        return 'Not Connected';
    }
  };

  const isLoading =
    connectionState === 'connecting' || connectionState === 'disconnecting';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]} />
      <ThemedText style={styles.text}>{getStatusText()}</ThemedText>
      {isLoading && (
        <ActivityIndicator size="small" color={tintColor} style={styles.loader} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
  },
  loader: {
    marginLeft: 8,
  },
});

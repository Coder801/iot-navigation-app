import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DeviceItem } from '@/components/bluetooth/device-item';
import type { BluetoothDeviceInfo } from '@/services/bluetooth/types';

interface DeviceListProps {
  title: string;
  devices: BluetoothDeviceInfo[];
  onDevicePress: (device: BluetoothDeviceInfo) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  connectedDeviceId?: string | null;
}

export function DeviceList({
  title,
  devices,
  onDevicePress,
  refreshing = false,
  onRefresh,
  emptyMessage = 'No devices found',
  connectedDeviceId,
}: DeviceListProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <DeviceItem
            device={item}
            onPress={() => onDevicePress(item)}
            isConnected={item.address === connectedDeviceId}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
          </View>
        }
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        scrollEnabled={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
  },
});

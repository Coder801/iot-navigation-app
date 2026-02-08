import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { BluetoothDeviceInfo } from '@/services/bluetooth/types';

interface DeviceItemProps {
  device: BluetoothDeviceInfo;
  onPress: () => void;
  isConnected?: boolean;
}

export function DeviceItem({
  device,
  onPress,
  isConnected = false,
}: DeviceItemProps) {
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ThemedView
        style={[styles.container, isConnected && styles.connectedContainer]}
      >
        <View style={styles.iconContainer}>
          <IconSymbol
            name={
              isConnected
                ? 'checkmark.circle.fill'
                : 'antenna.radiowaves.left.and.right'
            }
            size={24}
            color={isConnected ? tintColor : iconColor}
          />
        </View>

        <View style={styles.info}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {device.name}
          </ThemedText>
          <ThemedText style={styles.address} numberOfLines={1}>
            {device.address}
          </ThemedText>
        </View>

        <View style={styles.statusContainer}>
          {device.rssi !== undefined && (
            <ThemedText style={styles.rssiBadge}>{device.rssi} dBm</ThemedText>
          )}
          {isConnected && (
            <ThemedText style={[styles.connectedBadge, { color: tintColor }]}>
              Connected
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  connectedContainer: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  address: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  rssiBadge: {
    fontSize: 10,
    opacity: 0.6,
  },
  connectedBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
});

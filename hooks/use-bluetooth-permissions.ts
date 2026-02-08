import { useCallback, useState } from 'react';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

interface PermissionState {
  granted: boolean;
  checked: boolean;
  requesting: boolean;
}

export function useBluetoothPermissions() {
  const [permissionState, setPermissionState] = useState<PermissionState>({
    granted: Platform.OS === 'ios', // iOS permissions are handled by the system automatically
    checked: Platform.OS === 'ios',
    requesting: false,
  });

  const requestAndroidPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version;

      if (typeof apiLevel === 'number' && apiLevel >= 31) {
        // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return Object.values(results).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );
      }

      // Android < 12 requires location permission for BLE scanning
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    if (Platform.OS === 'ios') {
      // iOS BLE permissions are requested automatically when scanning starts
      setPermissionState({ granted: true, checked: true, requesting: false });
      return true;
    }

    setPermissionState((prev) => ({ ...prev, requesting: true }));

    try {
      const granted = await requestAndroidPermissions();
      setPermissionState({ granted, checked: true, requesting: false });
      return granted;
    } catch {
      setPermissionState({ granted: false, checked: true, requesting: false });
      return false;
    }
  }, [requestAndroidPermissions]);

  const openAppSettings = useCallback(() => {
    Alert.alert(
      'Permission Required',
      'Please grant Bluetooth permissions in Settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }, []);

  return {
    ...permissionState,
    checkPermissions,
    openAppSettings,
  };
}

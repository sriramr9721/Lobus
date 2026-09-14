import { FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useBleMesh } from '@/hooks/use-ble-mesh';

export default function BleTestScreen() {
  const insets = useSafeAreaInsets();
  const {
    isScanning,
    isAdvertising,
    discoveredNodes,
    receivedMessages,
    error,
    startScan,
    stopScan,
    sendHello,
  } = useBleMesh();

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">BLE Handshake Test</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Advertising: {isAdvertising ? 'on' : 'off'} · Scanning: {isScanning ? 'on' : 'off'}
        </ThemedText>
        {error && (
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        )}
      </ThemedView>

      <Pressable
        style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
        onPress={isScanning ? stopScan : startScan}>
        <ThemedText type="linkPrimary">{isScanning ? 'Stop scan' : 'Start scan'}</ThemedText>
      </Pressable>

      <ThemedText type="small" style={styles.sectionLabel}>
        Nearby Lobus nodes
      </ThemedText>
      <FlatList
        data={discoveredNodes}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary">
            No nodes found yet. Start a scan on this phone while another phone with the app open
            is nearby.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.deviceRow, pressed && styles.pressed]}
            onPress={() => sendHello(item.id)}>
            <ThemedView type="backgroundElement" style={styles.deviceCard}>
              <ThemedText type="smallBold">{item.name ?? 'Unnamed node'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.id} · RSSI {item.rssi ?? '—'}
              </ThemedText>
              <ThemedText type="small">Tap to send hello</ThemedText>
            </ThemedView>
          </Pressable>
        )}
      />

      <ThemedText type="small" style={styles.sectionLabel}>
        Received messages
      </ThemedText>
      <FlatList
        data={receivedMessages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary">
            Nothing received yet.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <ThemedView type="backgroundElement" style={styles.messageRow}>
            <ThemedText type="small">{item.text}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {new Date(item.receivedAt).toLocaleTimeString()}
            </ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
  errorText: {
    color: '#D64545',
  },
  scanButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    marginTop: Spacing.two,
  },
  list: {
    maxHeight: 180,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  deviceRow: {
    width: '100%',
  },
  deviceCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  messageRow: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

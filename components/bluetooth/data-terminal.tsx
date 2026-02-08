import { useState, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface DataTerminalProps {
  receivedData: string[];
  onSend: (data: string) => Promise<void>;
  isConnected: boolean;
}

export function DataTerminal({
  receivedData,
  onSend,
  isConnected,
}: DataTerminalProps) {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const handleSend = async () => {
    if (!inputText.trim() || !isConnected || sending) return;

    setSending(true);
    try {
      await onSend(inputText.trim());
      setInputText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.terminalContainer}>
        <ThemedText type="subtitle" style={styles.title}>
          Data Terminal
        </ThemedText>

        <ScrollView
          ref={scrollViewRef}
          style={styles.dataContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {receivedData.length === 0 ? (
            <ThemedText style={styles.placeholder}>
              Received data will appear here...
            </ThemedText>
          ) : (
            receivedData.map((data, index) => (
              <ThemedText key={index} style={styles.dataLine}>
                {`> ${data}`}
              </ThemedText>
            ))
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              { color: textColor, borderColor: tintColor, backgroundColor },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter data to send..."
            placeholderTextColor="rgba(128, 128, 128, 0.6)"
            editable={isConnected}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: tintColor },
              (!isConnected || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!isConnected || sending}
          >
            <ThemedText style={styles.sendButtonText}>
              {sending ? '...' : 'Send'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  terminalContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 12,
  },
  dataContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  placeholder: {
    opacity: 0.5,
    fontStyle: 'italic',
  },
  dataLine: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

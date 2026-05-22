import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from './colors';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onRequestClose?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onRequestClose,
}: CustomAlertProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.destructiveButton,
                  button.style === 'cancel' && styles.cancelButton,
                ]}
                onPress={button.onPress}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveText,
                    button.style === 'cancel' && styles.cancelText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: Colors.neutral?.offWhite || 'white',
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: 320,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary || '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.neutral?.darkGray || '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.neutral?.lightGray || '#f0f0f0',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.neutral?.lightGray || '#f0f0f0',
  },
  destructiveButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary || '#000',
  },
  cancelText: {
    color: Colors.neutral?.darkGray || '#666',
  },
  destructiveText: {
    color: 'white',
  },
});

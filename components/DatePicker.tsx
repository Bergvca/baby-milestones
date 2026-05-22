import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/components/colors';

export function DatePicker({
  onPress,
  disabled,
  s,
  onDateChange,
  selectedDate,
}: {
  onPress: () => void;
  disabled: boolean;
  s: string;
  onDateChange?: (date: Date) => void;
  selectedDate?: Date;
}) {
  const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateChange) {
      const newDate = new Date(event.target.value);
      onDateChange(newDate);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.datePickerContainer}>
        <input
          type="date"
          value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
          onChange={handleWebDateChange}
          disabled={disabled}
          style={{
            backgroundColor: '#f0f0f0',
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: 16,
            color: Colors.neutral?.darkGray || '#333',
            minWidth: 150,
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.datePickerContainer}>
      <Text style={styles.dateLabel}>Date:</Text>
      <TouchableOpacity style={styles.dateButton} onPress={onPress} disabled={disabled}>
        <Text style={styles.dateButtonText}>{s}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral?.darkGray || '#333',
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.neutral?.darkGray || '#333',
  },
});

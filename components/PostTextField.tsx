import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from './colors';

type Props = {
    value: string;
    onChangeText: (text: string) => void;
};

export default function PostTextField({ value, onChangeText }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Post text</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCapitalize="sentences"
                autoCorrect
                style={styles.input}
                accessibilityLabel="Post text input"
                placeholderTextColor={Colors.neutral.darkGray}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: Colors.neutral.darkGray,
        fontWeight: '500',
    },
    input: {
        minHeight: 96,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.neutral.darkGray,
        backgroundColor: Colors.neutral.white,
        color: Colors.neutral.darkGray,
        fontSize: 14,
    },
});
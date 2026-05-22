import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
  PressableProps,
} from 'react-native';
import { Colors } from '@/components/colors';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <Text
        style={[styles.text, styles[`${variant}Text`], disabled && styles.disabledText, textStyle]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
  },
  primary: {
    backgroundColor: Colors.primary, // Material Design primary color
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  secondary: {
    backgroundColor: Colors.secondary, // Material Design secondary color
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#000000',
  },
  outlineText: {
    color: '#6200ee',
  },
  disabledText: {
    color: '#666666',
  },
});

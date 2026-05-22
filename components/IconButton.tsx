import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from './colors'; // Adjust path as needed

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export default function IconButton({ icon, label, onPress, variant = 'primary' }: Props) {
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;

  return (
    <Pressable style={[styles.iconButton, buttonStyle]} onPress={onPress}>
      <MaterialIcons name={icon} size={24} color={Colors.neutral.white} />
      <Text style={styles.iconButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
  },
  iconButtonLabel: {
    color: Colors.neutral.white,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});

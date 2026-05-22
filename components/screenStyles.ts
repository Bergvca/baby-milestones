// screenStyles.ts
import { StyleSheet } from 'react-native';
import { Colors } from '@/components/colors';

export const screenStyles = StyleSheet.create({
  // Main screen background
  container: {
    flex: 1,
    backgroundColor: Colors.neutral?.offWhite || '#25292e',
    padding: 16,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  backButton: {
    padding: 8,
  },

  // Centered content (loading, empty state, etc.)
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.neutral?.offWhite || '#25292e',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.neutral.white,

    elevation: 2,
    shadowColor: Colors.neutral.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Primary text (normal body)
  text: {
    color: Colors.neutral?.darkGray || '#ffffff',
    fontSize: 16,
  },

  // Error text
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
  },

  // Common list padding
  listContent: {
    paddingBottom: 24,
  },

  // Shared input style
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral?.darkGray || '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.neutral?.darkGray || '#000',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    color: Colors.neutral?.darkGray || '#000',
    marginBottom: 4,
  },

  // ===== Shared Add-Family-like styles =====

  // Scroll area
  scrollView: {
    flex: 1,
  },

  // Title text for screens
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },

  // Subtitle / description text
  subtitle: {
    fontSize: 16,
    color: Colors.neutral.lightGray,
    lineHeight: 22,
  },

  // Form wrapper
  form: {
    padding: 20,
  },

  // Input + label + helper text wrapper
  inputContainer: {
    marginBottom: 16,
  },

  // Multi-line text area extension
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },

  // Small helper / counter text
  helperTextRight: {
    textAlign: 'right',
    fontSize: 12,
    color: Colors.neutral.lightGray,
    marginTop: 4,
  },

  buttonRow: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    gap: 12,
  },

  // Secondary / outline button
  secondaryButton: {
    flex: 0.6,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray,
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 44,
    minHeight: 44,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
  },

  // Destructive / danger button
  dangerButton: {
    flex: 0.6,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 44,
    minHeight: 44,
  },

  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.white,
  },

  // Shared button style
  primaryButton: {
    backgroundColor: Colors.primary || '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.5,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Disabled state helpers
  disabledButton: {
    backgroundColor: Colors.neutral.lightGray,
  },

  disabledButtonText: {
    color: Colors.neutral.darkGray,
  },
  addButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    backgroundColor: Colors.neutral.white,
    alignItems: 'center',
    paddingBottom: 15,
    marginBottom: 16,
    shadowColor: Colors.neutral.darkGray,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.neutral.lightGray,
  },
  menuSection: {
    backgroundColor: Colors.neutral.white,
    marginBottom: 16,
    elevation: 1,
    shadowColor: Colors.neutral.darkGray,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.darkGray,
    marginLeft: 16,
  },
  logoutButton: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutText: {
    color: Colors.neutral.darkGray,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutIcon: {
    backgroundColor: Colors.secondary,
    fontSize: 24,
  },
  arrowIcon: {
    color: Colors.neutral.lightGray,
    backgroundColor: Colors.neutral.white,
    fontSize: 24,
  },
  primaryIcon: {
    color: Colors.primary,
    backgroundColor: Colors.neutral.white,
    fontSize: 24,
  },
  sectionHeader: {
    paddingLeft: 10,
    paddingTop: 5,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  familyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: Colors.neutral.darkGray,
    fontWeight: '500',
  },
});

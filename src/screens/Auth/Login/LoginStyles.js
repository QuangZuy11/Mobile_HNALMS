import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // Container styles
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 56,
    paddingHorizontal: 48,
    // Note: box-shadow not available in React Native
  },

  // Logo styles
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    justifyContent: 'center',
    minHeight: 120,
  },
  logo: {
    width: 280,
    height: 160,
  },

  // Text styles
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 31,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form section styles
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },

  // Input wrapper and icon
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingRight: 16,
    height: 44,
  },
  inputIcon: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 18,
    height: 18,
    color: '#9CA3AF',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 14,
    color: '#1F2937',
  },
  inputPlaceholder: {
    color: '#9CA3AF',
  },

  // Eye icon button
  eyeIconButton: {
    padding: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
    height: 28,
  },

  // Options (Remember & Forgot)
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#FCD34D',
    borderColor: '#FCD34D',
  },
  checkmark: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  rememberText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 6,
  },
  forgotLink: {
    fontSize: 13,
    color: '#3579C6',
    fontWeight: '500',
  },

  // Button styles
  loginButton: {
    backgroundColor: '#3579C6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 44,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Validation popup
  validationPopup: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FCD34D',
    zIndex: 1000,
  },
  validationPopupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  validationPopupIcon: {
    width: 20,
    height: 20,
    color: '#D97706',
  },
  validationPopupText: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 21,
  },

  // Error state
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorMessage: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },

  // Forgot Password
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },

  // Footer
  footer: {
    marginTop: 24,
  },

  // Success state
  successMessage: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
});

export default styles;

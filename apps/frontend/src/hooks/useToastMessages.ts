import { useToast } from '../contexts/ToastContext';
import { useMemo } from 'react';

export const useToastMessages = () => {
  const { addToast } = useToast();

  return useMemo(() => ({
    // Auth messages
    loginSuccess: () => addToast('Welcome back! You are now logged in.', 'success', 2500),
    loginError: (error?: string) => addToast(error || 'Login failed. Please check your credentials.', 'error'),
    signupSuccess: () => addToast('Account created successfully! Welcome to JPMaster!', 'success', 2500),
    signupError: (error?: string) => addToast(error || 'Sign up failed. Please try again.', 'error'),
    logoutSuccess: () => addToast('You have been logged out successfully.', 'success', 2000),
    googleAuthWarning: () => addToast('Google OAuth configuration is required. See console for details.', 'warning'),

    // Validation messages
    validationError: (field: string) => addToast(`Please check your ${field} field.`, 'error', 2500),
    passwordMismatch: () => addToast('Passwords do not match.', 'error', 2500),

    // General messages
    success: (message: string) => addToast(message, 'success', 2500),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info', 3000),
    warning: (message: string) => addToast(message, 'warning', 3000),
  }), [addToast]);
};

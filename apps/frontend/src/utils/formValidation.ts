import type { FieldValues, RegisterOptions } from 'react-hook-form';

type Rule<T extends FieldValues = FieldValues> = RegisterOptions<T>;

export const validationMessages = {
  required: (label: string) => `${label} is required`,
  email: 'Invalid email format',
  minLength: (label: string, min: number) => `${label} must be at least ${min} characters`,
  maxLength: (label: string, max: number) => `${label} must be at most ${max} characters`,
  min: (label: string, min: number) => `${label} must be at least ${min}`,
  max: (label: string, max: number) => `${label} must be at most ${max}`,
  url: 'Invalid URL format',
};

export const formRules = {
  required: <T extends FieldValues>(label: string): Rule<T> => ({
    required: validationMessages.required(label),
  }),

  email: <T extends FieldValues>(label = 'Email'): Rule<T> => ({
    required: validationMessages.required(label),
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: validationMessages.email,
    },
  }),

  password: <T extends FieldValues>(label = 'Password', min = 6): Rule<T> => ({
    required: validationMessages.required(label),
    minLength: {
      value: min,
      message: validationMessages.minLength(label, min),
    },
  }),

  minLength: <T extends FieldValues>(label: string, min: number): Rule<T> => ({
    minLength: {
      value: min,
      message: validationMessages.minLength(label, min),
    },
  }),

  maxLength: <T extends FieldValues>(label: string, max: number): Rule<T> => ({
    maxLength: {
      value: max,
      message: validationMessages.maxLength(label, max),
    },
  }),

  positiveNumber: <T extends FieldValues>(label: string, min = 1): Rule<T> => ({
    required: validationMessages.required(label),
    valueAsNumber: true,
    min: {
      value: min,
      message: validationMessages.min(label, min),
    },
  }),

  optionalUrl: <T extends FieldValues>(): Rule<T> => ({
    validate: (value) => {
      const text = String(value ?? '').trim();
      if (!text) return true;

      try {
        new URL(text);
        return true;
      } catch {
        return validationMessages.url;
      }
    },
  }),
};

export const sameAs = (sourceValue: string, sourceLabel: string) => (value: string) => {
  if (!value) return validationMessages.required('Confirm password');
  return value === sourceValue || `${sourceLabel} does not match`;
};

export const getFieldError = (error?: { message?: unknown }) => {
  return typeof error?.message === 'string' ? error.message : undefined;
};

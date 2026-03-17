export const colors = {
  primary: '#f97316',      // orange-500
  primaryDark: '#ea580c',  // orange-600
  primaryLight: '#fff7ed', // orange-50
  secondary: '#22c55e',    // green-500
  danger: '#ef4444',       // red-500
  background: '#f9fafb',   // gray-50
  white: '#ffffff',
  text: '#111827',         // gray-900
  textMuted: '#6b7280',    // gray-500
  textLight: '#9ca3af',    // gray-400
  border: '#e5e7eb',       // gray-200
  borderFocus: '#f97316',
  cardBg: '#ffffff',
  inputBg: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '500' as const, color: colors.text },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

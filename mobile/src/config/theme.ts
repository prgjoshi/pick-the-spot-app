export const colors = {
  primary: '#C24B2F',        // terracotta
  primaryDark: '#8B2200',    // dark terracotta
  primaryLight: '#F5C4B3',   // light terracotta
  secondary: '#6B7C45',      // olive green
  secondaryLight: '#E4EDCE', // olive light
  danger: '#A33B22',         // clay red (exclusions / destructive actions)
  background: '#F7F3EE',     // warm parchment
  white: '#ffffff',
  text: '#3D2B1F',           // dark brown
  textMuted: '#7A6050',      // medium brown
  textLight: '#A8947E',      // light brown
  border: 'rgba(61,43,31,0.12)',
  borderFocus: '#C24B2F',
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
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

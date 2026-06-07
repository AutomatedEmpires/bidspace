export const colors = {
  background: "#f8f9fb",
  surface: "#ffffff",
  surfaceMuted: "#f1f3f6",
  textPrimary: "#101828",
  textSecondary: "#475467",
  textMuted: "#667085",
  border: "#d0d5dd",
  focus: "#2e90fa",
  danger: "#d92d20",
} as const;

export const typography = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  sizeXs: "0.75rem",
  sizeSm: "0.875rem",
  sizeMd: "1rem",
  sizeLg: "1.125rem",
  sizeXl: "1.25rem",
  weightRegular: 400,
  weightMedium: 500,
  weightSemibold: 600,
  lineHeightTight: 1.25,
  lineHeightBase: 1.5,
} as const;

export const spacing = {
  xxs: "0.25rem",
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;

export const radius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  pill: "999px",
} as const;

export const shadow = {
  sm: "0 1px 2px rgba(16, 24, 40, 0.06)",
  md: "0 8px 24px rgba(16, 24, 40, 0.08)",
} as const;

export const motion = {
  fast: "120ms",
  normal: "200ms",
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadow,
  motion,
} as const;

export const tokenCssVariables = `:root {
  --bs-color-background: ${colors.background};
  --bs-color-surface: ${colors.surface};
  --bs-color-surface-muted: ${colors.surfaceMuted};
  --bs-color-text-primary: ${colors.textPrimary};
  --bs-color-text-secondary: ${colors.textSecondary};
  --bs-color-text-muted: ${colors.textMuted};
  --bs-color-border: ${colors.border};
  --bs-color-focus: ${colors.focus};
  --bs-color-danger: ${colors.danger};

  --bs-font-family: ${typography.fontFamily};
  --bs-font-size-xs: ${typography.sizeXs};
  --bs-font-size-sm: ${typography.sizeSm};
  --bs-font-size-md: ${typography.sizeMd};
  --bs-font-size-lg: ${typography.sizeLg};
  --bs-font-size-xl: ${typography.sizeXl};

  --bs-space-xxs: ${spacing.xxs};
  --bs-space-xs: ${spacing.xs};
  --bs-space-sm: ${spacing.sm};
  --bs-space-md: ${spacing.md};
  --bs-space-lg: ${spacing.lg};
  --bs-space-xl: ${spacing.xl};

  --bs-radius-sm: ${radius.sm};
  --bs-radius-md: ${radius.md};
  --bs-radius-lg: ${radius.lg};
  --bs-radius-xl: ${radius.xl};
  --bs-radius-pill: ${radius.pill};

  --bs-shadow-sm: ${shadow.sm};
  --bs-shadow-md: ${shadow.md};

  --bs-motion-fast: ${motion.fast};
  --bs-motion-normal: ${motion.normal};
  --bs-motion-easing-standard: ${motion.easingStandard};
}`;

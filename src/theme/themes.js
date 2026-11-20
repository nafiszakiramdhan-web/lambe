// Token warna Glassmorphism & Multi-Aksen untuk LAMBE sesuai DESIGN.md

export const BASE_THEMES = {
  dark: {
    isDark: true,
    bgBase: '#09090B',
    glassSurface: 'rgba(24, 24, 29, 0.68)',
    glassElevated: 'rgba(34, 34, 42, 0.82)',
    glassBorder: 'rgba(255, 255, 255, 0.11)',
    glassHighlight: 'rgba(255, 255, 255, 0.18)',
    textPrimary: '#F4F4F6',
    textSecondary: '#9CA3AF',
    blurTint: 'dark',
  },
  light: {
    isDark: false,
    bgBase: '#F3F2EE',
    glassSurface: 'rgba(255, 255, 255, 0.72)',
    glassElevated: 'rgba(255, 255, 255, 0.88)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    glassHighlight: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#141416',
    textSecondary: '#6B7280',
    blurTint: 'light',
  },
};

export const ACCENT_PALETTES = {
  lime: {
    key: 'lime',
    label: 'Acid Lime',
    previewColor: '#C8FF2E',
    dark: {
      accent: '#C8FF2E',
      onAccent: '#09090B',
      glow: 'rgba(200, 255, 46, 0.16)',
    },
    light: {
      accent: '#65A30D',
      onAccent: '#FFFFFF',
      glow: 'rgba(101, 163, 13, 0.14)',
    },
  },
  amber: {
    key: 'amber',
    label: 'Amber Signal',
    previewColor: '#F59E0B',
    dark: {
      accent: '#F59E0B',
      onAccent: '#09090B',
      glow: 'rgba(245, 158, 11, 0.18)',
    },
    light: {
      accent: '#D97706',
      onAccent: '#FFFFFF',
      glow: 'rgba(217, 119, 6, 0.14)',
    },
  },
  violet: {
    key: 'violet',
    label: 'Electric Violet',
    previewColor: '#8B5CF6',
    dark: {
      accent: '#8B5CF6',
      onAccent: '#FFFFFF',
      glow: 'rgba(139, 92, 246, 0.22)',
    },
    light: {
      accent: '#7C3AED',
      onAccent: '#FFFFFF',
      glow: 'rgba(124, 58, 237, 0.14)',
    },
  },
  crimson: {
    key: 'crimson',
    label: 'Vermilion Red',
    previewColor: '#EF4444',
    dark: {
      accent: '#EF4444',
      onAccent: '#FFFFFF',
      glow: 'rgba(239, 68, 68, 0.20)',
    },
    light: {
      accent: '#DC2626',
      onAccent: '#FFFFFF',
      glow: 'rgba(220, 38, 38, 0.14)',
    },
  },
  pink: {
    key: 'pink',
    label: 'Rose Pink',
    previewColor: '#F472B6',
    dark: {
      accent: '#F472B6',
      onAccent: '#09090B',
      glow: 'rgba(244, 114, 182, 0.22)',
    },
    light: {
      accent: '#EC4899',
      onAccent: '#FFFFFF',
      glow: 'rgba(236, 72, 153, 0.16)',
    },
  },
};

export const ACCENT_LIST = Object.values(ACCENT_PALETTES);

export const getTheme = (mode = 'dark', accentKey = 'lime') => {
  const currentMode = mode in BASE_THEMES ? mode : 'dark';
  const currentAccentKey = accentKey in ACCENT_PALETTES ? accentKey : 'lime';

  const base = BASE_THEMES[currentMode];
  const accentDef = ACCENT_PALETTES[currentAccentKey];
  const accentValues = accentDef[currentMode];

  return {
    mode: currentMode,
    accentKey: currentAccentKey,
    accentLabel: accentDef.label,
    ...base,
    ...accentValues,
  };
};

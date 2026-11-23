// Token warna Glassmorphism & Multi-Tema untuk LAMBE sesuai DESIGN.md & SPEC.md

export const PRESET_THEMES = {
  glass_dark: {
    id: 'glass_dark',
    label: 'Glass Dark',
    description: 'Kaca buram obsidian & pendar halus',
    isDark: true,
    bgBase: '#09090B',
    glassSurface: 'rgba(24, 24, 29, 0.72)',
    glassElevated: 'rgba(34, 34, 42, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassHighlight: 'rgba(255, 255, 255, 0.20)',
    textPrimary: '#F4F4F6',
    textSecondary: '#9CA3AF',
    divider: 'rgba(255, 255, 255, 0.08)',
    threadLine: 'rgba(255, 255, 255, 0.16)',
    blurTint: 'dark',
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight (OLED)',
    description: 'Hitam pekat OLED, kontras tinggi & hemat baterai',
    isDark: true,
    bgBase: '#000000',
    glassSurface: 'rgba(18, 18, 20, 0.90)',
    glassElevated: 'rgba(28, 28, 32, 0.96)',
    glassBorder: 'rgba(255, 255, 255, 0.16)',
    glassHighlight: 'rgba(255, 255, 255, 0.26)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    divider: 'rgba(255, 255, 255, 0.12)',
    threadLine: 'rgba(255, 255, 255, 0.22)',
    blurTint: 'dark',
  },
  light_frosted: {
    id: 'light_frosted',
    label: 'Light Frosted',
    description: 'Kaca buram cerah, bersih & sejuk',
    isDark: false,
    bgBase: '#F4F5F7',
    glassSurface: 'rgba(255, 255, 255, 0.80)',
    glassElevated: 'rgba(255, 255, 255, 0.95)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    glassHighlight: 'rgba(255, 255, 255, 0.98)',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    divider: 'rgba(0, 0, 0, 0.06)',
    threadLine: 'rgba(0, 0, 0, 0.12)',
    blurTint: 'light',
  },
};

// Aliases for backwards compatibility
export const BASE_THEMES = {
  dark: PRESET_THEMES.glass_dark,
  glass_dark: PRESET_THEMES.glass_dark,
  midnight: PRESET_THEMES.midnight,
  light: PRESET_THEMES.light_frosted,
  light_frosted: PRESET_THEMES.light_frosted,
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
      accent: '#4D7C0F', // Keterbacaan kontras tinggi di latar terang
      onAccent: '#FFFFFF',
      glow: 'rgba(77, 124, 15, 0.14)',
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
      accent: '#DB2777',
      onAccent: '#FFFFFF',
      glow: 'rgba(219, 39, 119, 0.16)',
    },
  },
};

export const THEME_LIST = Object.values(PRESET_THEMES);
export const ACCENT_LIST = Object.values(ACCENT_PALETTES);

export const getTheme = (themeId = 'glass_dark', accentKey = 'lime') => {
  // Resolusi ID tema yang didukung
  let resolvedThemeId = themeId;
  if (resolvedThemeId === 'dark') resolvedThemeId = 'glass_dark';
  if (resolvedThemeId === 'light') resolvedThemeId = 'light_frosted';
  if (!PRESET_THEMES[resolvedThemeId]) {
    resolvedThemeId = 'glass_dark';
  }

  const base = PRESET_THEMES[resolvedThemeId];
  const currentAccentKey = accentKey in ACCENT_PALETTES ? accentKey : 'lime';
  const accentDef = ACCENT_PALETTES[currentAccentKey];
  const accentValues = base.isDark ? accentDef.dark : accentDef.light;

  return {
    id: resolvedThemeId,
    mode: base.isDark ? 'dark' : 'light',
    themeLabel: base.label,
    themeDesc: base.description,
    accentKey: currentAccentKey,
    accentLabel: accentDef.label,
    ...base,
    ...accentValues,
  };
};

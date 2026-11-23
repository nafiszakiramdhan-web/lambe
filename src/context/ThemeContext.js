import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, THEME_LIST, ACCENT_LIST } from '../theme/themes';

const STORAGE_KEY_THEME = '@lambe_theme_id';
const STORAGE_KEY_ACCENT = '@lambe_theme_accent';

// Fallback helper untuk web localStorage jika dibutuhkan
const getStorageItem = async (key) => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val) return val;
    }
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = async (key, value) => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Gagal menyimpan storage key ${key}:`, error);
  }
};

const ThemeContext = createContext({
  theme: getTheme('glass_dark', 'lime'),
  themeId: 'glass_dark',
  accentKey: 'lime',
  themeList: THEME_LIST,
  accentList: ACCENT_LIST,
  setThemeId: () => {},
  setAccentKey: () => {},
  toggleTheme: () => {},
  isReady: false,
});

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeIdState] = useState('glass_dark');
  const [accentKey, setAccentKeyState] = useState('lime');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const [savedTheme, savedAccent] = await Promise.all([
          getStorageItem(STORAGE_KEY_THEME),
          getStorageItem(STORAGE_KEY_ACCENT),
        ]);

        if (savedTheme) {
          let resolved = savedTheme;
          if (resolved === 'dark') resolved = 'glass_dark';
          if (resolved === 'light') resolved = 'light_frosted';
          if (['glass_dark', 'midnight', 'light_frosted'].includes(resolved)) {
            setThemeIdState(resolved);
          }
        }

        if (savedAccent && ['lime', 'amber', 'violet', 'crimson', 'pink'].includes(savedAccent)) {
          setAccentKeyState(savedAccent);
        }
      } catch (error) {
        console.warn('Gagal memuat preferensi tema:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadSavedPreferences();
  }, []);

  const setThemeId = async (newThemeId) => {
    let resolved = newThemeId;
    if (resolved === 'dark') resolved = 'glass_dark';
    if (resolved === 'light') resolved = 'light_frosted';

    if (!['glass_dark', 'midnight', 'light_frosted'].includes(resolved)) return;
    setThemeIdState(resolved);
    await setStorageItem(STORAGE_KEY_THEME, resolved);
  };

  const setAccentKey = async (newAccent) => {
    if (!['lime', 'amber', 'violet', 'crimson', 'pink'].includes(newAccent)) return;
    setAccentKeyState(newAccent);
    await setStorageItem(STORAGE_KEY_ACCENT, newAccent);
  };

  const toggleTheme = () => {
    const sequence = ['glass_dark', 'midnight', 'light_frosted'];
    const currentIndex = sequence.indexOf(themeId);
    const nextTheme = sequence[(currentIndex + 1) % sequence.length];
    setThemeId(nextTheme);
  };

  const currentTheme = getTheme(themeId, accentKey);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeId,
        mode: currentTheme.mode,
        accentKey,
        themeList: THEME_LIST,
        accentList: ACCENT_LIST,
        setThemeId,
        setMode: setThemeId, // backward-compat
        setAccentKey,
        toggleTheme,
        toggleMode: toggleTheme, // backward-compat
        isReady,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

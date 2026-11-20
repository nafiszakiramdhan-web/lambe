import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, ACCENT_LIST } from '../theme/themes';

const STORAGE_KEY_MODE = '@lambe_theme_mode';
const STORAGE_KEY_ACCENT = '@lambe_theme_accent';

const ThemeContext = createContext({
  theme: getTheme('dark', 'lime'),
  mode: 'dark',
  accentKey: 'lime',
  accentList: ACCENT_LIST,
  setMode: () => {},
  setAccentKey: () => {},
  toggleMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState('dark');
  const [accentKey, setAccentKeyState] = useState('lime');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const [savedMode, savedAccent] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_MODE),
          AsyncStorage.getItem(STORAGE_KEY_ACCENT),
        ]);

        if (savedMode && (savedMode === 'dark' || savedMode === 'light')) {
          setModeState(savedMode);
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

  const setMode = async (newMode) => {
    if (newMode !== 'dark' && newMode !== 'light') return;
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_MODE, newMode);
    } catch (error) {
      console.warn('Gagal menyimpan mode tema:', error);
    }
  };

  const setAccentKey = async (newAccent) => {
    if (!['lime', 'amber', 'violet', 'crimson', 'pink'].includes(newAccent)) return;
    setAccentKeyState(newAccent);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ACCENT, newAccent);
    } catch (error) {
      console.warn('Gagal menyimpan aksen tema:', error);
    }
  };

  const toggleMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  const currentTheme = getTheme(mode, accentKey);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        mode,
        accentKey,
        accentList: ACCENT_LIST,
        setMode,
        setAccentKey,
        toggleMode,
        isReady,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

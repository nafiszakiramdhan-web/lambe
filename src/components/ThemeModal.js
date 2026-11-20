import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Moon, Sun, X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemeModal({ visible, onClose }) {
  const { theme, mode, accentKey, accentList, setMode, setAccentKey } =
    useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Prevent click propagating from sheet */}
        <Pressable
          style={styles.sheetContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <BlurView
            intensity={65}
            tint={theme.blurTint}
            style={[
              styles.blurSheet,
              {
                backgroundColor: theme.glassElevated,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: theme.textSecondary, opacity: 0.3 },
              ]}
            />

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Tema & Tampilan
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Bagian 1: Mode Tampilan */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                MODE TAMPILAN
              </Text>
              <View style={styles.modeRow}>
                {/* Dark Mode Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor:
                        mode === 'dark'
                          ? theme.isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.08)'
                          : 'transparent',
                      borderColor:
                        mode === 'dark' ? theme.accent : theme.glassBorder,
                    },
                  ]}
                  onPress={() => setMode('dark')}
                >
                  <Moon
                    size={18}
                    color={mode === 'dark' ? theme.accent : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      {
                        color:
                          mode === 'dark' ? theme.accent : theme.textSecondary,
                        fontWeight: mode === 'dark' ? '700' : '500',
                      },
                    ]}
                  >
                    Dark Mode
                  </Text>
                </TouchableOpacity>

                {/* Light Mode Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.modeButton,
                    {
                      backgroundColor:
                        mode === 'light'
                          ? theme.isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 0, 0, 0.08)'
                          : 'transparent',
                      borderColor:
                        mode === 'light' ? theme.accent : theme.glassBorder,
                    },
                  ]}
                  onPress={() => setMode('light')}
                >
                  <Sun
                    size={18}
                    color={
                      mode === 'light' ? theme.accent : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      {
                        color:
                          mode === 'light' ? theme.accent : theme.textSecondary,
                        fontWeight: mode === 'light' ? '700' : '500',
                      },
                    ]}
                  >
                    Light Mode
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bagian 2: Warna Aksen */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                WARNA AKSEN
              </Text>
              <View style={styles.accentGrid}>
                {accentList.map((item) => {
                  const isSelected = accentKey === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.8}
                      onPress={() => setAccentKey(item.key)}
                      style={[
                        styles.accentCard,
                        {
                          backgroundColor: isSelected
                            ? theme.isDark
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(0, 0, 0, 0.06)'
                            : 'transparent',
                          borderColor: isSelected
                            ? item.previewColor
                            : theme.glassBorder,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          {
                            backgroundColor: item.previewColor,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Check
                            size={14}
                            color={
                              item.key === 'lime' || item.key === 'amber'
                                ? '#09090B'
                                : '#FFFFFF'
                            }
                            strokeWidth={3}
                          />
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.accentName,
                          {
                            color: isSelected
                              ? theme.textPrimary
                              : theme.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Catatan Bawah */}
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              Pengaturan tema tersimpan otomatis di perangkatmu.
            </Text>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
  },
  blurSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  modeButtonText: {
    fontSize: 14,
  },
  accentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  accentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentName: {
    fontSize: 13,
  },
  noteText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

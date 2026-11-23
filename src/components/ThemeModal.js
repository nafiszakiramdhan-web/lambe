import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Moon, Sun, Sparkles, X, Check, Palette } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemeModal({ visible, onClose }) {
  const {
    theme,
    themeId,
    accentKey,
    themeList,
    accentList,
    setThemeId,
    setAccentKey,
  } = useTheme();

  const getThemeIcon = (id) => {
    switch (id) {
      case 'midnight':
        return <Moon size={18} color={themeId === id ? theme.accent : theme.textSecondary} />;
      case 'light_frosted':
        return <Sun size={18} color={themeId === id ? theme.accent : theme.textSecondary} />;
      case 'glass_dark':
      default:
        return <Sparkles size={18} color={themeId === id ? theme.accent : theme.textSecondary} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheetContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <BlurView
            intensity={75}
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
              <View style={styles.headerTitleRow}>
                <Palette size={20} color={theme.accent} />
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  Tema & Tampilan
                </Text>
              </View>
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Bagian 1: Pilihan Tema Latar */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text
                    style={[styles.sectionLabel, { color: theme.textSecondary }]}
                  >
                    GAYA TEMA DASAR
                  </Text>
                  <Text
                    style={[styles.activeBadge, { color: theme.accent }]}
                  >
                    {theme.themeLabel}
                  </Text>
                </View>

                <View style={styles.themeOptionsGrid}>
                  {themeList.map((t) => {
                    const isSelected = themeId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        activeOpacity={0.8}
                        style={[
                          styles.themeCard,
                          {
                            backgroundColor: isSelected
                              ? theme.isDark
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.06)'
                              : theme.isDark
                              ? 'rgba(255, 255, 255, 0.04)'
                              : 'rgba(0, 0, 0, 0.02)',
                            borderColor: isSelected
                              ? theme.accent
                              : theme.glassBorder,
                            borderWidth: isSelected ? 1.5 : 1,
                          },
                        ]}
                        onPress={() => setThemeId(t.id)}
                      >
                        <View style={styles.themeCardTop}>
                          <View
                            style={[
                              styles.themeIconWrapper,
                              {
                                backgroundColor: isSelected
                                  ? theme.glow
                                  : 'transparent',
                              },
                            ]}
                          >
                            {getThemeIcon(t.id)}
                          </View>
                          {isSelected && (
                            <View
                              style={[
                                styles.checkIndicator,
                                { backgroundColor: theme.accent },
                              ]}
                            >
                              <Check size={12} color={theme.onAccent} />
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.themeName,
                            {
                              color: isSelected
                                ? theme.accent
                                : theme.textPrimary,
                            },
                          ]}
                        >
                          {t.label}
                        </Text>
                        <Text
                          style={[
                            styles.themeDesc,
                            { color: theme.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {t.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Garis Pemisah */}
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.divider || theme.glassBorder },
                ]}
              />

              {/* Bagian 2: 5 Kotak Warna Aksen LAMBE */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text
                    style={[styles.sectionLabel, { color: theme.textSecondary }]}
                  >
                    AKSEN WARNA LAMBE
                  </Text>
                  <Text
                    style={[styles.activeBadge, { color: theme.accent }]}
                  >
                    {theme.accentLabel}
                  </Text>
                </View>

                <View style={styles.accentGrid}>
                  {accentList.map((item) => {
                    const isSelected = accentKey === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.8}
                        style={[
                          styles.accentCard,
                          {
                            backgroundColor: isSelected
                              ? theme.isDark
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.06)'
                              : 'transparent',
                            borderColor: isSelected
                              ? item.previewColor
                              : theme.glassBorder,
                            borderWidth: isSelected ? 1.5 : 1,
                          },
                        ]}
                        onPress={() => setAccentKey(item.key)}
                      >
                        <View
                          style={[
                            styles.accentColorDot,
                            { backgroundColor: item.previewColor },
                          ]}
                        >
                          {isSelected && (
                            <Check
                              size={14}
                              color={
                                item.key === 'lime' || item.key === 'pink'
                                  ? '#09090B'
                                  : '#FFFFFF'
                              }
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.accentLabel,
                            {
                              color: isSelected
                                ? theme.textPrimary
                                : theme.textSecondary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Tombol Tutup / Selesai */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.doneButton,
                  { backgroundColor: theme.accent },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.doneButtonText,
                    { color: theme.onAccent },
                  ]}
                >
                  Terapkan Tampilan
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '85%',
  },
  blurSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    paddingBottom: 24,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeOptionsGrid: {
    gap: 10,
  },
  themeCard: {
    borderRadius: 16,
    padding: 14,
  },
  themeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  themeIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  themeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  accentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
    flexBasis: '48%',
    flexGrow: 1,
  },
  accentColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentLabel: {
    fontSize: 13,
  },
  doneButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

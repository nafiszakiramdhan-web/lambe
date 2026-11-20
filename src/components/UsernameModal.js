import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Shuffle, Check, Ghost } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import {
  generateRandomUsername,
  sanitizeUsername,
  validateUsername,
} from '../lib/usernameGenerator';

export default function UsernameModal({
  visible,
  currentUsername = '',
  onClose,
  onSuccess,
}) {
  const { theme } = useTheme();
  const [username, setUsername] = useState(currentUsername);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(currentUsername || '');
    }
  }, [visible, currentUsername]);

  const handleRandomize = () => {
    setUsername(generateRandomUsername());
  };

  const handleChangeText = (text) => {
    setUsername(sanitizeUsername(text));
  };

  const handleSave = async () => {
    const clean = username.toLowerCase().trim();
    if (clean === currentUsername) {
      onClose();
      return;
    }

    const errorMsg = validateUsername(clean);
    if (errorMsg) {
      Alert.alert('Perhatian', errorMsg);
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        throw new Error('Sesi tidak valid.');
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            username: clean,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (updateErr) {
        if (
          updateErr.code === '23505' ||
          updateErr.message?.includes('duplicate key') ||
          updateErr.message?.includes('unique')
        ) {
          Alert.alert(
            'Nama Sudah Digunakan',
            'Username sudah dipakai, coba yang lain.'
          );
          return;
        }
        throw updateErr;
      }

      if (onSuccess) {
        onSuccess(clean);
      }
      onClose();
    } catch (err) {
      Alert.alert(
        'Gagal Mengganti Nama',
        err?.message || 'Terjadi kesalahan saat memperbarui nama samaran.'
      );
    } finally {
      setLoading(false);
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
            {/* Drag Handle */}
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: theme.textSecondary, opacity: 0.3 },
              ]}
            />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Ghost size={20} color={theme.accent} />
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  Ganti Nama Samaran
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

            <Text style={[styles.desc, { color: theme.textSecondary }]}>
              Nama samaran baru akan langsung terpasang pada seluruh postingan dan
              balasanmu di linimasa.
            </Text>

            {/* Label & Acak */}
            <View style={styles.labelRow}>
              <Text
                style={[styles.inputLabel, { color: theme.textSecondary }]}
              >
                NAMA SAMARAN BARU
              </Text>
              <TouchableOpacity
                style={[
                  styles.randomBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                onPress={handleRandomize}
              >
                <Shuffle size={13} color={theme.accent} />
                <Text style={[styles.randomBtnText, { color: theme.accent }]}>
                  Acak
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Container */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(0, 0, 0, 0.3)'
                    : 'rgba(255, 255, 255, 0.6)',
                  borderColor: theme.glassBorder,
                },
              ]}
            >
              <Text style={[styles.prefixText, { color: theme.accent }]}>
                @
              </Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="nama_samaran"
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={handleChangeText}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              <Text
                style={[styles.counterText, { color: theme.textSecondary }]}
              >
                {username.length}/20
              </Text>
            </View>

            <Text style={[styles.rulesText, { color: theme.textSecondary }]}>
              3–20 karakter: huruf kecil (a-z), angka (0-9), garis bawah (_).
            </Text>

            {/* Tombol Simpan */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading || !username}
              style={[
                styles.saveButton,
                {
                  backgroundColor: theme.accent,
                  opacity: loading || !username ? 0.6 : 1,
                },
              ]}
              onPress={handleSave}
            >
              {loading ? (
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <>
                  <Check size={18} color={theme.onAccent} />
                  <Text
                    style={[styles.saveButtonText, { color: theme.onAccent }]}
                  >
                    Simpan Nama Samaran
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  randomBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
  },
  counterText: {
    fontSize: 11,
    marginLeft: 6,
  },
  rulesText: {
    fontSize: 11,
    marginTop: 6,
    marginBottom: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

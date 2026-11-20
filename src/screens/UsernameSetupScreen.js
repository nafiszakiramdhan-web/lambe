import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ghost, Shuffle, ArrowRight, Shield, LogOut } from 'lucide-react-native';
import GlassBackground from '../components/GlassBackground';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import {
  generateRandomUsername,
  sanitizeUsername,
  validateUsername,
} from '../lib/usernameGenerator';

export default function UsernameSetupScreen({ onUsernameSet }) {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Buat saran awal otomatis
  useEffect(() => {
    setUsername(generateRandomUsername());
  }, []);

  const handleRandomize = () => {
    setUsername(generateRandomUsername());
  };

  const handleChangeText = (text) => {
    setUsername(sanitizeUsername(text));
  };

  const handleSubmit = async () => {
    const errorMsg = validateUsername(username);
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
        throw new Error('Sesi tidak valid. Silakan masuk kembali.');
      }

      // Simpan ke tabel profiles dengan kolom user_id
      const { error: profileErr } = await supabase.from('profiles').insert({
        user_id: user.id,
        username: username.toLowerCase().trim(),
      });

      if (profileErr) {
        // Postgres error 23505 = unique_violation
        if (
          profileErr.code === '23505' ||
          profileErr.message?.includes('duplicate key') ||
          profileErr.message?.includes('unique')
        ) {
          Alert.alert(
            'Nama Sudah Digunakan',
            'Username sudah dipakai, coba yang lain.'
          );
          return;
        }
        throw profileErr;
      }

      // Panggil callback agar App.js tahu setup selesai
      if (onUsernameSet) {
        onUsernameSet(username);
      }
    } catch (err) {
      Alert.alert(
        'Gagal Menyimpan',
        err?.message || 'Terjadi kesalahan saat menyimpan nama samaran.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <GlassBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Logo */}
            <View style={styles.brandContainer}>
              <View
                style={[
                  styles.logoCircle,
                  {
                    backgroundColor: theme.glassElevated,
                    borderColor: theme.accent,
                  },
                ]}
              >
                <Ghost size={34} color={theme.accent} />
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Pilih Nama Samaran
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Setiap keluh kesah dan celetukanmu akan muncul di linimasa menggunakan
                nama ini. Tetap 100% anonim tanpa profil publik.
              </Text>
            </View>

            {/* Kotak Pengingat */}
            <View
              style={[
                styles.noteCard,
                {
                  backgroundColor: theme.glassSurface,
                  borderColor: theme.glassBorder,
                },
              ]}
            >
              <Shield size={18} color={theme.accent} style={styles.noteIcon} />
              <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                Nama samaran bisa kamu ubah kapan saja dari menu di atas linimasa.
                Tidak ada orang lain yang bisa melihat email atau membuka profilmu.
              </Text>
            </View>

            {/* Kartu Form Input Username */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.glassElevated,
                  borderColor: theme.glassBorder,
                },
              ]}
            >
              <View style={styles.labelRow}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  NAMA SAMARAN UNIK
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
                  <Shuffle size={14} color={theme.accent} />
                  <Text
                    style={[styles.randomBtnText, { color: theme.accent }]}
                  >
                    Acak
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Field dengan prefix @ */}
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(0, 0, 0, 0.35)'
                      : 'rgba(255, 255, 255, 0.65)',
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

              <Text
                style={[styles.rulesText, { color: theme.textSecondary }]}
              >
                3–20 karakter, hanya huruf kecil (a-z), angka (0-9), dan garis bawah (_).
              </Text>

              {/* Tombol Simpan */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loading || !username}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: theme.accent,
                    shadowColor: theme.accent,
                    opacity: loading || !username ? 0.6 : 1,
                  },
                ]}
                onPress={handleSubmit}
              >
                {loading ? (
                  <ActivityIndicator color={theme.onAccent} />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.submitButtonText,
                        { color: theme.onAccent },
                      ]}
                    >
                      Mulai Melampiaskan Unek-Unek
                    </Text>
                    <ArrowRight size={18} color={theme.onAccent} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Tombol Keluar jika salah akun */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <LogOut size={16} color={theme.textSecondary} />
              <Text
                style={[styles.logoutText, { color: theme.textSecondary }]}
              >
                Keluar / Ganti Akun
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    alignItems: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  noteCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    width: '100%',
    alignItems: 'flex-start',
  },
  noteIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  formCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    paddingHorizontal: 14,
    height: 50,
  },
  prefixText: {
    fontSize: 18,
    fontWeight: '800',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  counterText: {
    fontSize: 11,
    marginLeft: 6,
  },
  rulesText: {
    fontSize: 11,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 15,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

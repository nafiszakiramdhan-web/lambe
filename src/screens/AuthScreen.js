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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Ghost,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

import GlassBackground from '../components/GlassBackground';
import { useTheme } from '../context/ThemeContext';
import { supabase, withTimeout } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Ikon Google Asli
function GoogleIcon({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function AuthScreen({ route, navigation }) {
  const { theme } = useTheme();

  // Mode: 'login' | 'register' | 'forgot_password' | 'reset_password'
  const [authView, setAuthView] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (title, msg) => {
    setErrorMessage(msg);
    Alert.alert(title, msg);
  };

  // Jika navigasi membuka layar ini dengan parameter isRecovery
  useEffect(() => {
    if (route?.params?.isRecovery) {
      setAuthView('reset_password');
    }
  }, [route?.params?.isRecovery]);

  // Handle Login & Register
  const handleSubmit = async () => {
    setErrorMessage('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      showError('Perhatian', 'Harap isi email dan kata sandi dengan lengkap.');
      return;
    }

    if (trimmedPassword.length < 6) {
      showError('Perhatian', 'Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    if (authView === 'register') {
      if (trimmedPassword !== trimmedConfirmPassword) {
        showError('Perhatian', 'Kata sandi dan konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setLoading(true);

    try {
      if (authView === 'login') {
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: trimmedPassword,
          }),
          12000,
          'Koneksi masuk ke server melebihi batas waktu. Periksa koneksi internetmu dan coba lagi.'
        );

        if (error) throw error;
      } else {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email: trimmedEmail,
            password: trimmedPassword,
          }),
          12000,
          'Koneksi pendaftaran ke server melebihi batas waktu. Periksa koneksi internetmu dan coba lagi.'
        );

        if (error) throw error;

        // Auto-confirm fallback: coba login jika belum terbentuk sesi
        if (data?.user && !data?.session) {
          const { error: signInErr } = await withTimeout(
            supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password: trimmedPassword,
            }),
            12000,
            'Akun dibuat, namun login otomatis melebihi batas waktu. Silakan masuk manual.'
          );
          if (signInErr) {
            Alert.alert(
              'Pendaftaran Berhasil',
              'Akun berhasil dibuat. Silakan masuk menggunakan email dan sandimu.'
            );
            setAuthView('login');
          }
        }
      }
    } catch (err) {
      let message = err?.message || 'Terjadi kesalahan saat memproses permintaan.';
      if (message.includes('Invalid login credentials')) {
        message = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
      } else if (message.includes('User already registered')) {
        message = 'Email ini sudah terdaftar. Silakan pilih tab Masuk.';
      }
      showError('Gagal', message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Lupa Sandi (Kirim Tautan Reset)
  const handleForgotPassword = async () => {
    setErrorMessage('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showError('Perhatian', 'Harap masukkan alamat email akunmu terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const webRedirect =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.pathname.startsWith('/lambe')
            ? `${window.location.origin}/lambe/`
            : window.location.href.split('#')[0].split('?')[0]
          : 'lambeapp://reset-password';

      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: webRedirect,
        }),
        12000,
        'Permintaan kirim tautan reset melebihi batas waktu. Coba lagi.'
      );

      if (error) throw error;

      Alert.alert(
        'Tautan Terkirim',
        'Tautan pemulihan kata sandi telah dikirim ke emailmu. Silakan periksa kotak masuk atau spam.',
        [
          {
            text: 'OK',
            onPress: () => setAuthView('login'),
          },
        ]
      );
    } catch (err) {
      showError(
        'Gagal Mengirim Tautan',
        err?.message || 'Tidak dapat mengirim tautan pemulihan kata sandi.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Setel Sandi Baru
  const handleUpdatePassword = async () => {
    setErrorMessage('');
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmNewPassword.trim();

    if (!trimmedNew || !trimmedConfirm) {
      showError('Perhatian', 'Harap isi sandi baru dan konfirmasinya.');
      return;
    }

    if (trimmedNew.length < 6) {
      showError('Perhatian', 'Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      showError('Perhatian', 'Kata sandi baru dan konfirmasi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({
          password: trimmedNew,
        }),
        12000,
        'Pembaruan kata sandi melebihi batas waktu. Coba lagi.'
      );

      if (error) throw error;

      Alert.alert('Berhasil', 'Kata sandi baru berhasil disimpan.', [
        {
          text: 'Masuk',
          onPress: () => {
            setNewPassword('');
            setConfirmNewPassword('');
            setAuthView('login');
          },
        },
      ]);
    } catch (err) {
      showError(
        'Gagal Memperbarui Sandi',
        err?.message || 'Terjadi kesalahan saat memperbarui kata sandi.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      // Di Web (termasuk GitHub Pages /lambe/), gunakan redirect langsung ke halaman aktif
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const redirectTo = window.location.pathname.startsWith('/lambe')
          ? `${window.location.origin}/lambe/`
          : window.location.href.split('#')[0].split('?')[0];

        const { error } = await withTimeout(
          supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo,
            },
          }),
          12000,
          'Koneksi Google OAuth melebihi batas waktu. Silakan coba lagi.'
        );

        if (error) throw error;
        return;
      }

      const redirectTo = makeRedirectUri({
        scheme: 'lambeapp',
      });

      const { data, error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        }),
        12000,
        'Koneksi Google OAuth melebihi batas waktu. Silakan coba lagi.'
      );

      if (error) throw error;
      if (!data?.url) {
        throw new Error('Tidak dapat memperoleh URL otentikasi Google.');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const url = result.url;
        let access_token = null;
        let refresh_token = null;
        let code = null;

        if (url.includes('#')) {
          const hash = url.split('#')[1];
          const params = new URLSearchParams(hash);
          access_token = params.get('access_token');
          refresh_token = params.get('refresh_token');
        }

        if (url.includes('?')) {
          const query = url.split('?')[1].split('#')[0];
          const params = new URLSearchParams(query);
          if (!code) code = params.get('code');
          if (!access_token) access_token = params.get('access_token');
          if (!refresh_token) refresh_token = params.get('refresh_token');
        }

        if (code) {
          const { error: exchangeError } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            12000,
            'Penukaran sesi Google melebihi batas waktu.'
          );
          if (exchangeError) throw exchangeError;
        } else if (access_token && refresh_token) {
          const { error: sessionError } = await withTimeout(
            supabase.auth.setSession({
              access_token,
              refresh_token,
            }),
            12000,
            'Penyimpanan sesi Google melebihi batas waktu.'
          );
          if (sessionError) throw sessionError;
        }
      }
    } catch (err) {
      showError(
        'Gagal Masuk dengan Google',
        err?.message || 'Terjadi kesalahan saat menghubungkan akun Google.'
      );
    } finally {
      setLoading(false);
    }
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
            <View style={styles.desktopWrapper}>
            {/* Header Brand */}
            <View style={styles.brandContainer}>
              <View
                style={[
                  styles.logoImageWrapper,
                  {
                    backgroundColor: theme.glassElevated,
                    borderColor: theme.glassBorder,
                  },
                ]}
              >
                <Image
                  source={require('../../assets/lambe-logo.png')}
                  style={styles.brandLogoImage}
                  resizeMode="contain"
                />
              </View>
              <View
                style={[
                  styles.badgeAnonim,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    borderColor: theme.accent,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.accent }]}>
                  100% Anonim
                </Text>
              </View>
              <Text style={[styles.tagline, { color: theme.textSecondary }]}>
                Ruang keluh kesah & celetukan jujur tanpa nama asli, tanpa profil.
              </Text>
            </View>

            {/* Kotak Info Anonimitas */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: theme.glassSurface,
                  borderColor: theme.glassBorder,
                },
              ]}
            >
              <ShieldCheck
                size={20}
                color={theme.accent}
                style={styles.infoIcon}
              />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
                  Identitas Terlindungi 100%
                </Text>
                <Text style={[styles.infoDesc, { color: theme.textSecondary }]}>
                  Email hanya untuk keamanan akun. Postinganmu memakai @username
                  samaran dan tidak ada halaman profil publik yang dapat dikunjungi siapapun.
                </Text>
              </View>
            </View>

            {/* KARTU FORMULIR */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.glassElevated,
                  borderColor: theme.glassBorder,
                },
              ]}
            >
              {Boolean(errorMessage) && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}
              {/* TAMPILAN 1 & 2: LOGIN / REGISTER */}
              {(authView === 'login' || authView === 'register') && (
                <>
                  {/* Tab Switcher Masuk / Daftar */}
                  <View
                    style={[
                      styles.tabSwitcher,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(0, 0, 0, 0.3)'
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: theme.glassBorder,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.tabButton,
                        authView === 'login' && [
                          styles.tabButtonActive,
                          {
                            backgroundColor: theme.isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : '#FFFFFF',
                          },
                        ],
                      ]}
                      onPress={() => setAuthView('login')}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color:
                              authView === 'login'
                                ? theme.textPrimary
                                : theme.textSecondary,
                            fontWeight: authView === 'login' ? '700' : '500',
                          },
                        ]}
                      >
                        Masuk
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.tabButton,
                        authView === 'register' && [
                          styles.tabButtonActive,
                          {
                            backgroundColor: theme.isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : '#FFFFFF',
                          },
                        ],
                      ]}
                      onPress={() => setAuthView('register')}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color:
                              authView === 'register'
                                ? theme.textPrimary
                                : theme.textSecondary,
                            fontWeight: authView === 'register' ? '700' : '500',
                          },
                        ]}
                      >
                        Daftar Akun
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Input Email */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.textSecondary }]}
                    >
                      EMAIL
                    </Text>
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
                      <Mail
                        size={18}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: theme.textPrimary }]}
                        placeholder="emailkamu@example.com"
                        placeholderTextColor={theme.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Input Kata Sandi */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.textSecondary }]}
                    >
                      KATA SANDI
                    </Text>
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
                      <Lock
                        size={18}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: theme.textPrimary }]}
                        placeholder="Minimal 6 karakter"
                        placeholderTextColor={theme.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((prev) => !prev)}
                        style={styles.eyeIconBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} color={theme.textSecondary} />
                        ) : (
                          <Eye size={18} color={theme.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Tautan Lupa Sandi (Khusus Mode Masuk) */}
                  {authView === 'login' && (
                    <TouchableOpacity
                      style={styles.forgotPasswordBtn}
                      onPress={() => setAuthView('forgot_password')}
                    >
                      <Text
                        style={[
                          styles.forgotPasswordText,
                          { color: theme.accent },
                        ]}
                      >
                        Lupa sandi?
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Input Konfirmasi Kata Sandi (Khusus Mode Daftar) */}
                  {authView === 'register' && (
                    <View style={styles.inputGroup}>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        KONFIRMASI KATA SANDI
                      </Text>
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
                        <Lock
                          size={18}
                          color={theme.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: theme.textPrimary }]}
                          placeholder="Ulangi kata sandi"
                          placeholderTextColor={theme.textSecondary}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          style={styles.eyeIconBtn}
                          hitSlop={{
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10,
                          }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} color={theme.textSecondary} />
                          ) : (
                            <Eye size={18} color={theme.textSecondary} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Tombol Submit Masuk/Daftar */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={loading}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: theme.accent,
                        shadowColor: theme.accent,
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
                          {authView === 'login'
                            ? 'Masuk ke LAMBE'
                            : 'Buat Akun Anonim'}
                        </Text>
                        <ArrowRight size={18} color={theme.onAccent} />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Pemisah "atau" */}
                  <View style={styles.dividerRow}>
                    <View
                      style={[
                        styles.dividerLine,
                        { backgroundColor: theme.glassBorder },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dividerText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      atau
                    </Text>
                    <View
                      style={[
                        styles.dividerLine,
                        { backgroundColor: theme.glassBorder },
                      ]}
                    />
                  </View>

                  {/* Tombol Lanjutkan dengan Google */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={loading}
                    style={[
                      styles.googleButton,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: theme.glassBorder,
                      },
                    ]}
                    onPress={handleGoogleSignIn}
                  >
                    <GoogleIcon size={18} />
                    <Text
                      style={[
                        styles.googleButtonText,
                        { color: theme.textPrimary },
                      ]}
                    >
                      Lanjutkan dengan Google
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* TAMPILAN 3: FORM LUPA SANDI */}
              {authView === 'forgot_password' && (
                <View>
                  <View style={styles.sectionHeader}>
                    <KeyRound size={22} color={theme.accent} />
                    <Text
                      style={[styles.sectionTitle, { color: theme.textPrimary }]}
                    >
                      Pulihkan Kata Sandi
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Masukkan email akunmu. Kami akan mengirimkan tautan untuk
                    menyetel ulang kata sandi.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.textSecondary }]}
                    >
                      EMAIL
                    </Text>
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
                      <Mail
                        size={18}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: theme.textPrimary }]}
                        placeholder="emailkamu@example.com"
                        placeholderTextColor={theme.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={loading}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: theme.accent,
                        shadowColor: theme.accent,
                      },
                    ]}
                    onPress={handleForgotPassword}
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
                          Kirim Tautan Pemulihan
                        </Text>
                        <ArrowRight size={18} color={theme.onAccent} />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backLinkBtn}
                    onPress={() => setAuthView('login')}
                  >
                    <ArrowLeft size={16} color={theme.textSecondary} />
                    <Text
                      style={[
                        styles.backLinkText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Kembali ke Masuk
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* TAMPILAN 4: FORM SETEL SANDI BARU (RECOVERY FLOW) */}
              {authView === 'reset_password' && (
                <View>
                  <View style={styles.sectionHeader}>
                    <KeyRound size={22} color={theme.accent} />
                    <Text
                      style={[styles.sectionTitle, { color: theme.textPrimary }]}
                    >
                      Buat Kata Sandi Baru
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Tentukan kata sandi baru untuk akunmu (minimal 6 karakter).
                  </Text>

                  {/* Sandi Baru */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.textSecondary }]}
                    >
                      SANDI BARU
                    </Text>
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
                      <Lock
                        size={18}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: theme.textPrimary }]}
                        placeholder="Minimal 6 karakter"
                        placeholderTextColor={theme.textSecondary}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword((prev) => !prev)}
                        style={styles.eyeIconBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showNewPassword ? (
                          <EyeOff size={18} color={theme.textSecondary} />
                        ) : (
                          <Eye size={18} color={theme.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Konfirmasi Sandi Baru */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.textSecondary }]}
                    >
                      KONFIRMASI SANDI BARU
                    </Text>
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
                      <Lock
                        size={18}
                        color={theme.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: theme.textPrimary }]}
                        placeholder="Ulangi sandi baru"
                        placeholderTextColor={theme.textSecondary}
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        secureTextEntry={!showConfirmNewPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmNewPassword((prev) => !prev)
                        }
                        style={styles.eyeIconBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showConfirmNewPassword ? (
                          <EyeOff size={18} color={theme.textSecondary} />
                        ) : (
                          <Eye size={18} color={theme.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={loading}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: theme.accent,
                        shadowColor: theme.accent,
                      },
                    ]}
                    onPress={handleUpdatePassword}
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
                          Simpan Sandi Baru
                        </Text>
                        <ArrowRight size={18} color={theme.onAccent} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
            </View>
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
  desktopWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
  },
  badgeAnonim: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: 4,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
    width: '100%',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  formCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  eyeIconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 14,
    paddingVertical: 2,
  },
  forgotPasswordText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 4,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  backLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

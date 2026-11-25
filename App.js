import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { supabase, withTimeout } from './src/lib/supabase';

import AuthScreen from './src/screens/AuthScreen';
import UsernameSetupScreen from './src/screens/UsernameSetupScreen';
import FeedScreen from './src/screens/FeedScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import ThreadScreen from './src/screens/ThreadScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { theme, isReady } = useTheme();
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(null);
  const [hasUsername, setHasUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const checkingProfileRef = useRef(false);

  // Cek apakah pengguna sudah memiliki nama samaran di tabel profiles (dengan timeout)
  const checkUserProfile = useCallback(async (userId) => {
    if (!userId || checkingProfileRef.current) return;
    checkingProfileRef.current = true;
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('username')
          .eq('user_id', userId)
          .maybeSingle(),
        10000,
        'Gagal memuat profil anonim (timeout).'
      );

      if (!error && data?.username) {
        setUsername(data.username);
        setHasUsername(true);
      } else {
        setUsername(null);
        setHasUsername(false);
      }
    } catch (err) {
      console.warn('Gagal memuat profil pengguna:', err);
      setHasUsername(false);
    } finally {
      checkingProfileRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Fallback pengaman: pastikan loading tidak pernah macet selamanya
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 10000);

    // 1. Tangani deep link awal jika aplikasi dibuka dari tautan email / web URL
    const handleInitialUrl = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const href = window.location.href || '';
          if (href.includes('reset-password') || href.includes('type=recovery')) {
            setIsRecovery(true);
          }
          return;
        }
        const url = await Linking.getInitialURL();
        if (url && (url.includes('reset-password') || url.includes('type=recovery'))) {
          setIsRecovery(true);
        }
      } catch (err) {
        console.warn('Gagal membaca URL deep link:', err);
      }
    };
    handleInitialUrl();

    // 2. Dengarkan event deep link saat aplikasi sedang berjalan
    const subscriptionLinking = Linking.addEventListener('url', ({ url }) => {
      if (url && (url.includes('reset-password') || url.includes('type=recovery'))) {
        setIsRecovery(true);
      }
    });

    // 3. Ambil sesi Supabase yang tersimpan dengan timeout & catch
    withTimeout(
      supabase.auth.getSession(),
      10000,
      'Gagal memeriksa sesi login.'
    )
      .then(({ data: { session: currentSession } }) => {
        if (!isMounted) return;
        setSession(currentSession);
        if (currentSession?.user?.id) {
          checkUserProfile(currentSession.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error getSession:', err);
        if (isMounted) setLoading(false);
      });

    // 4. Dengarkan perubahan status autentikasi TANPA await query di dalam callback (cegah deadlock lock Supabase)
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }

      if (currentSession?.user?.id) {
        // Jadwalkan di tick berikutnya agar tidak bentrok dengan auth lock
        setTimeout(() => {
          if (isMounted) {
            checkUserProfile(currentSession.user.id);
          }
        }, 0);
      } else {
        setUsername(null);
        setHasUsername(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscriptionLinking?.remove();
      authSub?.unsubscribe();
    };
  }, [checkUserProfile]);

  if (loading || !isReady) {
    return (
      <View
        style={[
          styles.loadingScreen,
          { backgroundColor: theme.bgBase },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // Jika sesi recovery aktif
  if (isRecovery) {
    return (
      <NavigationContainer>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bgBase },
          }}
        >
          <Stack.Screen
            name="AuthRecovery"
            component={AuthScreen}
            initialParams={{ isRecovery: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Jika sudah login tetapi belum memiliki @username samaran
  if (session && session.user && hasUsername === false) {
    return (
      <>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <UsernameSetupScreen
          onUsernameSet={(newUname) => {
            setUsername(newUname);
            setHasUsername(true);
          }}
        />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: theme.bgBase },
        }}
      >
        {session && session.user ? (
          <>
            <Stack.Screen
              name="Feed"
              component={FeedScreen}
              initialParams={{ currentUsername: username }}
            />
            <Stack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Thread"
              component={ThreadScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

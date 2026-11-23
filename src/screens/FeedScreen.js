import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  Palette,
  LogOut,
  Plus,
  Ghost,
  MessageSquareQuote,
  Pencil,
} from 'lucide-react-native';
import GlassBackground from '../components/GlassBackground';
import PostCard from '../components/PostCard';
import ThemeModal from '../components/ThemeModal';
import UsernameModal from '../components/UsernameModal';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { sharePost } from '../lib/shareHelper';

const ACCENT_COLORS = ['#C8FF2E', '#F59E0B', '#8B5CF6', '#EF4444', '#F472B6'];

export default function FeedScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(
    route?.params?.currentUsername || ''
  );

  // Ambil user id dan username saat ini dari auth & profiles
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          setCurrentUserId(authData.user.id);

          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (profileData?.username) {
            setCurrentUsername(profileData.username);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat profil user di feed:', err);
      }
    };
    fetchUserAndProfile();
  }, []);

  // Fetch daftar tweet anonim
  const fetchTweets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('anon_tweets')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTweets(data || []);
    } catch (err) {
      console.warn('Gagal memuat feed anonim:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTweets();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchTweets();
    });

    return unsubscribe;
  }, [navigation, fetchTweets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTweets();
  };

  // Toggle Like (Optimistic Update)
  const handleToggleLike = async (item) => {
    if (!currentUserId) return;

    const previousLiked = Boolean(item.is_liked);
    const previousCount = Number(item.like_count) || 0;

    const newLiked = !previousLiked;
    const newCount = newLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    setTweets((prev) =>
      prev.map((t) =>
        t.id === item.id
          ? { ...t, is_liked: newLiked, like_count: newCount }
          : t
      )
    );

    try {
      if (previousLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: item.id, user_id: currentUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: item.id, user_id: currentUserId });
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Gagal mengubah status like:', err);
      setTweets((prev) =>
        prev.map((t) =>
          t.id === item.id
            ? { ...t, is_liked: previousLiked, like_count: previousCount }
            : t
        )
      );
    }
  };

  // Hapus postingan
  const handleDeletePost = async (item) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setTweets((prev) => prev.filter((t) => t.id !== item.id));
    } catch (err) {
      Alert.alert(
        'Gagal Menghapus',
        err.message || 'Terjadi kesalahan saat menghapus postingan.'
      );
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert(
      'Keluar dari Akun',
      'Apakah kamu yakin ingin keluar dari LAMBE? Kamu dapat masuk kembali kapan saja.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const handleUsernameUpdated = (newUsername) => {
    setCurrentUsername(newUsername);
    fetchTweets();
  };

  const headerHeight = insets.top + 64;

  return (
    <GlassBackground>
      {/* Top Glass Header dengan Identitas LAMBE */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <BlurView
          intensity={40}
          tint={theme.blurTint}
          style={[
            styles.blurHeader,
            {
              borderBottomColor: theme.glassBorder,
              backgroundColor: theme.glassSurface,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            {/* Logo Lingkaran Lambe */}
            <View
              style={[
                styles.headerLogoCircle,
                {
                  backgroundColor: theme.glassElevated,
                  borderColor: theme.accent,
                },
              ]}
            >
              <Image
                source={require('../../assets/lambe-logo.png')}
                style={styles.headerLogoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.brandCol}>
              <View style={styles.brandRow}>
                <Text style={[styles.brandText, { color: theme.textPrimary }]}>
                  LAMBE
                </Text>
                {/* 5 Kotak/Titik Warna Aksen Identitas Lambe */}
                <View style={styles.accentDotsRow}>
                  {ACCENT_COLORS.map((c, i) => (
                    <View
                      key={i}
                      style={[styles.accentMiniDot, { backgroundColor: c }]}
                    />
                  ))}
                </View>
              </View>

              <Text style={[styles.subBrandText, { color: theme.textSecondary }]}>
                ANONIM KELUH KESAH
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Pill Badge Username Pengguna Aktif */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.userPillBadge,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: theme.glassBorder,
                },
              ]}
              onPress={() => setUsernameModalVisible(true)}
            >
              <Text
                numberOfLines={1}
                style={[styles.userPillText, { color: theme.accent }]}
              >
                @{currentUsername || 'kamu'}
              </Text>
              <Pencil size={11} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Tombol Tema */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: theme.glassElevated,
                  borderColor: theme.glassBorder,
                },
              ]}
              onPress={() => setThemeModalVisible(true)}
            >
              <Palette size={17} color={theme.accent} />
            </TouchableOpacity>

            {/* Tombol Keluar */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: theme.glassElevated,
                  borderColor: theme.glassBorder,
                },
              ]}
              onPress={handleLogout}
            >
              <LogOut size={17} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* Feed List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Memuat linimasa keluh kesah...
          </Text>
        </View>
      ) : (
        <FlatList
          data={tweets}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard
              item={item}
              onPressCard={(post) => navigation.navigate('Thread', { post })}
              onPressReply={(post) => navigation.navigate('Thread', { post })}
              onToggleLike={handleToggleLike}
              onDelete={handleDeletePost}
              onShare={sharePost}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: headerHeight + 14,
              paddingBottom: 110,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
              progressViewOffset={headerHeight}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconContainer,
                  {
                    backgroundColor: theme.glassSurface,
                    borderColor: theme.glassBorder,
                  },
                ]}
              >
                <MessageSquareQuote size={40} color={theme.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                Belum ada keluh kesah
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Jadilah yang pertama meluapkan celetukan & unek-unek secara anonim di sini.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Floating Capsule Dock ala X / Threads */}
      <View
        style={[
          styles.floatingDockContainer,
          { bottom: Math.max(insets.bottom, 16) + 10 },
        ]}
      >
        <BlurView
          intensity={50}
          tint={theme.blurTint}
          style={[
            styles.floatingDock,
            {
              backgroundColor: theme.glassElevated,
              borderColor: theme.glassHighlight,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.dockButton,
              {
                backgroundColor: theme.accent,
              },
            ]}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Plus size={20} color={theme.onAccent} strokeWidth={2.5} />
            <Text style={[styles.dockButtonText, { color: theme.onAccent }]}>
              Tulis Keluh Kesah
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Modal Pemilih Tema */}
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />

      {/* Modal Ganti Username */}
      <UsernameModal
        visible={usernameModalVisible}
        currentUsername={currentUsername}
        onClose={() => setUsernameModalVisible(false)}
        onUpdated={handleUsernameUpdated}
      />
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
    padding: 2,
  },
  headerLogoImage: {
    width: '100%',
    height: '100%',
  },
  brandCol: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  accentDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  accentMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  subBrandText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  userPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 110,
    gap: 4,
  },
  userPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  floatingDockContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 90,
  },
  floatingDock: {
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 4,
  },
  dockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    gap: 8,
  },
  dockButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

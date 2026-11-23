import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Send, MessageCircle, Share2, Ghost } from 'lucide-react-native';
import GlassBackground from '../components/GlassBackground';
import PostCard from '../components/PostCard';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { sharePost } from '../lib/shareHelper';

export default function ThreadScreen({ route, navigation }) {
  const { post: initialPost } = route.params || {};
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const flatListRef = useRef(null);

  const [mainPost, setMainPost] = useState(initialPost);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('kamu');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Pantau kemunculan keyboard agar input bar selalu naik di atas keyboard
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Ambil profil user
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          setCurrentUserId(authData.user.id);

          const { data: prof } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (prof?.username) {
            setCurrentUsername(prof.username);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat profil user di thread:', err);
      }
    };
    fetchUserAndProfile();
  }, []);

  // Fetch daftar balasan anonim dari view anon_tweets
  const fetchReplies = useCallback(async () => {
    if (!initialPost?.id) return;
    try {
      const { data, error } = await supabase
        .from('anon_tweets')
        .select('*')
        .eq('parent_id', initialPost.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (err) {
      console.warn('Gagal memuat balasan thread:', err);
    } finally {
      setLoading(false);
    }
  }, [initialPost?.id]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  // Like handler untuk balasan atau main post
  const handleToggleLike = async (item) => {
    if (!currentUserId) return;

    const isMain = item.id === mainPost.id;
    const previousLiked = Boolean(item.is_liked);
    const previousCount = Number(item.like_count) || 0;

    const newLiked = !previousLiked;
    const newCount = newLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    if (isMain) {
      setMainPost((prev) => ({
        ...prev,
        is_liked: newLiked,
        like_count: newCount,
      }));
    } else {
      setReplies((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, is_liked: newLiked, like_count: newCount }
            : r
        )
      );
    }

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
      if (isMain) {
        setMainPost((prev) => ({
          ...prev,
          is_liked: previousLiked,
          like_count: previousCount,
        }));
      } else {
        setReplies((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? { ...r, is_liked: previousLiked, like_count: previousCount }
              : r
          )
        );
      }
    }
  };

  // Hapus item
  const handleDeleteItem = async (item) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      if (item.id === mainPost.id) {
        navigation.goBack();
      } else {
        setReplies((prev) => prev.filter((r) => r.id !== item.id));
        setMainPost((prev) => ({
          ...prev,
          reply_count: Math.max(0, (Number(prev.reply_count) || 1) - 1),
        }));
      }
    } catch (err) {
      Alert.alert('Gagal Menghapus', err.message || 'Gagal menghapus balasan.');
    }
  };

  // Kirim balasan anonim
  const handleSendReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || sending) return;

    setSending(true);

    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        throw new Error('Sesi tidak valid.');
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: trimmed,
          image_url: null,
          parent_id: mainPost.id,
        })
        .select()
        .single();

      if (error) throw error;

      setReplyText('');
      setMainPost((prev) => ({
        ...prev,
        reply_count: (Number(prev.reply_count) || 0) + 1,
      }));

      // Tambahkan balasan baru ke daftar
      const newReply = {
        id: data.id,
        author_id: user.id,
        is_mine: true,
        username: currentUsername,
        content: data.content,
        image_url: null,
        parent_id: mainPost.id,
        like_count: 0,
        is_liked: false,
        reply_count: 0,
        created_at: data.created_at,
      };

      setReplies((prev) => [...prev, newReply]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (err) {
      Alert.alert('Gagal Mengirim Balasan', err.message || 'Terjadi kesalahan.');
    } finally {
      setSending(false);
    }
  };

  const handleShareThread = () => {
    if (mainPost) {
      sharePost(mainPost);
    }
  };

  const isKeyboardOpen = keyboardHeight > 0;

  return (
    <GlassBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        {/* Header Bar ala X / Threads */}
        <View
          style={[
            styles.headerBar,
            {
              paddingTop: insets.top + 8,
              borderBottomColor: theme.glassBorder,
              backgroundColor: theme.glassSurface,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.headerBtn,
              {
                backgroundColor: theme.glassElevated,
                borderColor: theme.glassBorder,
              },
            ]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Thread Keluh Kesah
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              @{mainPost?.username || 'anonim'}
            </Text>
          </View>

          {/* Tombol Bagikan Thread di Header */}
          <TouchableOpacity
            style={[
              styles.headerBtn,
              {
                backgroundColor: theme.glassElevated,
                borderColor: theme.glassBorder,
              },
            ]}
            onPress={handleShareThread}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Share2 size={17} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* List: Main Post di HeaderList + Balasan di Items */}
        <FlatList
          ref={flatListRef}
          style={styles.flatList}
          data={replies}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <View style={styles.listHeaderWrapper}>
              {/* Post Utama */}
              {mainPost && (
                <PostCard
                  item={mainPost}
                  onToggleLike={handleToggleLike}
                  onDelete={handleDeleteItem}
                  onShare={sharePost}
                  isDetailed={true}
                  isThreadParent={replies.length > 0}
                />
              )}

              {/* Pemisah Balasan */}
              <View style={styles.repliesDivider}>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: theme.divider || theme.glassBorder },
                  ]}
                />
                <View style={styles.dividerLabelRow}>
                  <MessageCircle size={14} color={theme.accent} />
                  <Text
                    style={[
                      styles.repliesCountLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {replies.length} Balasan
                  </Text>
                </View>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: theme.divider || theme.glassBorder },
                  ]}
                />
              </View>

              {loading && (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="small" color={theme.accent} />
                  <Text
                    style={[styles.loadingText, { color: theme.textSecondary }]}
                  >
                    Memuat balasan...
                  </Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.replyCardWrapper}>
              <PostCard
                item={item}
                onToggleLike={handleToggleLike}
                onDelete={handleDeleteItem}
                onShare={sharePost}
                showThreadLine={index < replies.length - 1}
              />
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: isKeyboardOpen ? 40 : 30,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyReplies}>
                <Text
                  style={[
                    styles.emptyRepliesText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Belum ada balasan. Mulai alur thread dengan celetukanmu di bawah!
                </Text>
              </View>
            )
          }
        />

        {/* Bottom Glass Input Bar: Terangkat tepat di atas keyboard */}
        <View
          style={[
            styles.inputBarContainer,
            {
              paddingBottom:
                Platform.OS === 'android'
                  ? isKeyboardOpen
                    ? keyboardHeight + 8
                    : Math.max(insets.bottom, 12)
                  : Math.max(insets.bottom, 12),
            },
          ]}
        >
          <BlurView
            intensity={60}
            tint={theme.blurTint}
            style={[
              styles.blurInputBar,
              {
                backgroundColor: theme.glassElevated,
                borderColor: theme.glassHighlight,
              },
            ]}
          >
            <View
              style={[
                styles.replyAvatarMini,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: theme.accent,
                },
              ]}
            >
              <Ghost size={14} color={theme.accent} />
            </View>

            <TextInput
              style={[
                styles.replyInput,
                {
                  color: theme.textPrimary,
                },
              ]}
              placeholder={`Balas sebagai @${currentUsername || 'anonim'}...`}
              placeholderTextColor={theme.textSecondary}
              value={replyText}
              onChangeText={setReplyText}
              maxLength={500}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!replyText.trim() || sending}
              style={[
                styles.sendReplyBtn,
                {
                  backgroundColor: replyText.trim()
                    ? theme.accent
                    : theme.glassBorder,
                  opacity: replyText.trim() ? 1 : 0.5,
                },
              ]}
              onPress={handleSendReply}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.onAccent} />
              ) : (
                <Send size={15} color={theme.onAccent} />
              )}
            </TouchableOpacity>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listHeaderWrapper: {
    marginBottom: 8,
  },
  repliesDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repliesCountLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyCardWrapper: {
    marginBottom: 4,
  },
  loadingWrapper: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyReplies: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyRepliesText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  blurInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: 'hidden',
    gap: 8,
  },
  replyAvatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  sendReplyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

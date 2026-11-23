import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Heart, MessageCircle, Share2, Trash2, Ghost } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { parseImages } from '../lib/imageParser';
import { sharePost } from '../lib/shareHelper';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}j`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}h`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
};

export default function PostCard({
  item,
  onPressReply,
  onToggleLike,
  onDelete,
  onPressCard,
  onShare,
  showThreadLine = false,
  isThreadParent = false,
  isDetailed = false,
}) {
  const { theme } = useTheme();

  const isLiked = Boolean(item.is_liked);
  const likeCount = Number(item.like_count) || 0;
  const replyCount = Number(item.reply_count) || 0;
  const isMine = Boolean(item.is_mine);
  const images = parseImages(item.image_url);

  const handleDeletePress = () => {
    Alert.alert(
      'Hapus Postingan',
      'Apakah kamu yakin ingin menghapus keluh kesah anonim ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            if (onDelete) onDelete(item);
          },
        },
      ]
    );
  };

  const handleSharePress = async () => {
    if (onShare) {
      onShare(item);
    } else {
      await sharePost(item);
    }
  };

  const renderGallery = () => {
    if (!images || images.length === 0) return null;

    // 1 Gambar (Natural aspect ratio, tanpa crop agresif)
    if (images.length === 1) {
      return (
        <View
          style={[
            styles.singleImageWrapper,
            {
              borderColor: theme.glassBorder,
              backgroundColor: theme.glassElevated,
            },
          ]}
        >
          <Image
            source={{ uri: images[0] }}
            style={styles.imageFull}
            resizeMode="cover"
          />
        </View>
      );
    }

    // 2 Gambar (Dua kolom berdampingan ala X/Threads)
    if (images.length === 2) {
      return (
        <View style={styles.twoImageContainer}>
          {images.map((imgUri, idx) => (
            <View
              key={`${imgUri}-${idx}`}
              style={[
                styles.twoImageItem,
                {
                  borderColor: theme.glassBorder,
                  backgroundColor: theme.glassElevated,
                },
              ]}
            >
              <Image
                source={{ uri: imgUri }}
                style={styles.imageFull}
                resizeMode="cover"
              />
            </View>
          ))}
        </View>
      );
    }

    // 3 Gambar (1 Gambar besar di kiri, 2 gambar bertumpuk di kanan)
    if (images.length === 3) {
      return (
        <View style={styles.threeImageContainer}>
          <View
            style={[
              styles.threeImageLeft,
              {
                borderColor: theme.glassBorder,
                backgroundColor: theme.glassElevated,
              },
            ]}
          >
            <Image
              source={{ uri: images[0] }}
              style={styles.imageFull}
              resizeMode="cover"
            />
          </View>
          <View style={styles.threeImageRight}>
            <View
              style={[
                styles.threeImageRightItem,
                {
                  borderColor: theme.glassBorder,
                  backgroundColor: theme.glassElevated,
                },
              ]}
            >
              <Image
                source={{ uri: images[1] }}
                style={styles.imageFull}
                resizeMode="cover"
              />
            </View>
            <View
              style={[
                styles.threeImageRightItem,
                {
                  borderColor: theme.glassBorder,
                  backgroundColor: theme.glassElevated,
                },
              ]}
            >
              <Image
                source={{ uri: images[2] }}
                style={styles.imageFull}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      );
    }

    // 4 Gambar (Grid 2x2 proporsional)
    return (
      <View style={styles.fourImageContainer}>
        {images.slice(0, 4).map((imgUri, idx) => (
          <View
            key={`${imgUri}-${idx}`}
            style={[
              styles.fourImageItem,
              {
                borderColor: theme.glassBorder,
                backgroundColor: theme.glassElevated,
              },
            ]}
          >
            <Image
              source={{ uri: imgUri }}
              style={styles.imageFull}
              resizeMode="cover"
            />
            {idx === 3 && images.length > 4 && (
              <View style={styles.extraOverlay}>
                <Text style={styles.extraOverlayText}>+{images.length - 4}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={onPressCard || onPressReply ? 0.92 : 1}
      onPress={() => {
        if (onPressCard) {
          onPressCard(item);
        } else if (onPressReply) {
          onPressReply(item);
        }
      }}
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.glassSurface,
          borderColor: theme.glassBorder,
        },
      ]}
    >
      <View style={styles.threadRow}>
        {/* Kolom Kiri: Avatar & Garis Alur Thread Ala X / Threads */}
        <View style={styles.avatarColumn}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: theme.glassElevated,
                borderColor: theme.accent,
              },
            ]}
          >
            <Ghost size={18} color={theme.accent} />
          </View>

          {/* Garis vertikal alur thread ke bawah */}
          {(showThreadLine || isThreadParent) && (
            <View
              style={[
                styles.threadConnectorLine,
                {
                  backgroundColor: theme.threadLine || theme.glassBorder,
                },
              ]}
            />
          )}
        </View>

        {/* Kolom Kanan: Header, Isi Keluh Kesah, Foto, & Tombol Aksi */}
        <View style={styles.mainContentColumn}>
          {/* Header Kartu: @username · waktu · aksi hapus */}
          <View style={styles.headerRow}>
            <View style={styles.userMetaRow}>
              <Text
                style={[styles.authorName, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                @{item.username || 'anonim'}
              </Text>

              {isMine && (
                <View
                  style={[
                    styles.mineBadge,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderColor: theme.accent,
                    },
                  ]}
                >
                  <Text style={[styles.mineBadgeText, { color: theme.accent }]}>
                    Kamu
                  </Text>
                </View>
              )}

              <Text style={[styles.dotSeparator, { color: theme.textSecondary }]}>
                ·
              </Text>

              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                {formatRelativeTime(item.created_at)}
              </Text>
            </View>

            {/* Tombol Hapus jika milik akun sendiri */}
            {isMine && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeletePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Isi Teks Keluh Kesah */}
          <Text
            style={[
              styles.contentText,
              {
                color: theme.textPrimary,
                fontSize: isDetailed ? 16 : 15,
                lineHeight: isDetailed ? 24 : 22,
              },
            ]}
          >
            {item.content}
          </Text>

          {/* Layout Galeri Foto Adaptif (1-4 Foto) */}
          {renderGallery()}

          {/* Baris Tombol Aksi: Balas/Thread, Like, Bagikan */}
          <View style={styles.actionBar}>
            {/* 1. Tombol Balas / Thread */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onPressReply && onPressReply(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.actionIconPill,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)',
                  },
                ]}
              >
                <MessageCircle size={16} color={theme.textSecondary} />
              </View>
              <Text style={[styles.actionCount, { color: theme.textSecondary }]}>
                {replyCount}
              </Text>
            </TouchableOpacity>

            {/* 2. Tombol Like */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onToggleLike && onToggleLike(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.actionIconPill,
                  {
                    backgroundColor: isLiked
                      ? theme.glow || 'rgba(200, 255, 46, 0.16)'
                      : theme.isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)',
                  },
                ]}
              >
                <Heart
                  size={16}
                  color={isLiked ? theme.accent : theme.textSecondary}
                  fill={isLiked ? theme.accent : 'none'}
                />
              </View>
              <Text
                style={[
                  styles.actionCount,
                  {
                    color: isLiked ? theme.accent : theme.textSecondary,
                    fontWeight: isLiked ? '700' : '500',
                  },
                ]}
              >
                {likeCount}
              </Text>
            </TouchableOpacity>

            {/* 3. Tombol Bagikan (Share) */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleSharePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.actionIconPill,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)',
                  },
                ]}
              >
                <Share2 size={16} color={theme.textSecondary} />
              </View>
              <Text style={[styles.actionCount, { color: theme.textSecondary }]}>
                Bagikan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  threadRow: {
    flexDirection: 'row',
  },
  avatarColumn: {
    alignItems: 'center',
    width: 38,
    marginRight: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadConnectorLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    borderRadius: 1,
  },
  mainContentColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  mineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  mineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dotSeparator: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 6,
  },
  contentText: {
    lineHeight: 22,
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  singleImageWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 260,
  },
  imageFull: {
    width: '100%',
    height: '100%',
  },
  twoImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    height: 165,
  },
  twoImageItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  threeImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    height: 190,
  },
  threeImageLeft: {
    flex: 1.2,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  threeImageRight: {
    flex: 1,
    gap: 8,
  },
  threeImageRightItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fourImageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  fourImageItem: {
    position: 'relative',
    width: '48.5%',
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  extraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraOverlayText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingRight: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionIconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
});

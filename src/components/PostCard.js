import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Heart, MessageCircle, Trash2, Ghost } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { parseImages } from '../lib/imageParser';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}j lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}h lalu`;

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

  const renderGallery = () => {
    if (!images || images.length === 0) return null;

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

    if (images.length === 3) {
      return (
        <View style={styles.threeImageContainer}>
          {/* Sisi kiri: 1 gambar vertikal besar */}
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
          {/* Sisi kanan: 2 gambar bertumpuk */}
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

    // 4 foto atau lebih
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
      activeOpacity={onPressCard || onPressReply ? 0.9 : 1}
      onPress={() => {
        if (onPressCard) {
          onPressCard(item);
        } else if (onPressReply) {
          onPressReply(item);
        }
      }}
      style={[
        styles.card,
        {
          backgroundColor: theme.glassSurface,
          borderColor: theme.glassBorder,
        },
      ]}
    >
      {/* Header Kartu */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: theme.glassElevated,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            <Ghost size={18} color={theme.accent} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.authorName, { color: theme.textPrimary }]}>
                @{item.username || 'anonim'}
              </Text>
              {isMine && (
                <View
                  style={[
                    styles.mineBadge,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.1)'
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
            </View>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>
        </View>

        {/* Tombol Hapus jika milik sendiri */}
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

      {/* Konten Teks */}
      <Text style={[styles.content, { color: theme.textPrimary }]}>
        {item.content}
      </Text>

      {/* Galeri Foto Adaptif (1 - 4 Foto) */}
      {renderGallery()}

      {/* Footer Aksi */}
      <View style={styles.footer}>
        {/* Tombol Like */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isLiked
                ? theme.isDark
                  ? 'rgba(255, 255, 255, 0.07)'
                  : 'rgba(0, 0, 0, 0.04)'
                : 'transparent',
            },
          ]}
          onPress={() => onToggleLike && onToggleLike(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={18}
            color={isLiked ? theme.accent : theme.textSecondary}
            fill={isLiked ? theme.accent : 'none'}
          />
          <Text
            style={[
              styles.actionText,
              {
                color: isLiked ? theme.accent : theme.textSecondary,
                fontWeight: isLiked ? '600' : '400',
              },
            ]}
          >
            {likeCount}
          </Text>
        </TouchableOpacity>

        {/* Tombol Balas */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onPressReply && onPressReply(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MessageCircle size={18} color={theme.textSecondary} />
          <Text style={[styles.actionText, { color: theme.textSecondary }]}>
            {replyCount}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerInfo: {
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mineBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  mineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    marginTop: 1,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  singleImageWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 240,
  },
  imageFull: {
    width: '100%',
    height: '100%',
  },
  twoImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    height: 160,
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
    marginBottom: 12,
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
    marginBottom: 12,
  },
  fourImageItem: {
    position: 'relative',
    width: '48.5%',
    height: 105,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 13,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Image as ImageIcon, Camera, X, Send } from 'lucide-react-native';
import GlassBackground from '../components/GlassBackground';
import { useTheme } from '../context/ThemeContext';
import {
  pickAndCompressImages,
  takePhotoWithCamera,
  uploadMultipleImagesToCloudinary,
} from '../lib/cloudinary';
import { supabase } from '../lib/supabase';

const MAX_CHARS = 500;
const MAX_IMAGES = 4;

export default function CreatePostScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !loading;

  const handlePickImages = async () => {
    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) {
      Alert.alert(
        'Batas Maksimal',
        'Kamu hanya dapat melampirkan maksimal 4 foto per keluh kesah.'
      );
      return;
    }

    try {
      const newImages = await pickAndCompressImages(remainingSlots);
      if (newImages && newImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
      }
    } catch (err) {
      Alert.alert('Gagal Memilih Foto', err.message || 'Tidak dapat membuka galeri.');
    }
  };

  const handleTakePhoto = async () => {
    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) {
      Alert.alert(
        'Batas Maksimal',
        'Kamu hanya dapat melampirkan maksimal 4 foto per keluh kesah.'
      );
      return;
    }

    try {
      const newImage = await takePhotoWithCamera();
      if (newImage) {
        setSelectedImages((prev) => [...prev, newImage].slice(0, MAX_IMAGES));
      }
    } catch (err) {
      Alert.alert('Gagal Mengambil Foto', err.message || 'Tidak dapat membuka kamera.');
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);

    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        throw new Error('Sesi pengguna tidak valid. Silakan masuk kembali.');
      }

      let finalImageUrl = null;

      if (selectedImages.length > 0) {
        const uploadedUrls = await uploadMultipleImagesToCloudinary(
          selectedImages,
          (current, total) => {
            setStatusMessage(`Mengunggah foto ${current} dari ${total}...`);
          }
        );

        if (uploadedUrls.length === 1) {
          finalImageUrl = uploadedUrls[0];
        } else if (uploadedUrls.length > 1) {
          finalImageUrl = JSON.stringify(uploadedUrls);
        }
      }

      setStatusMessage('Mengirim keluh kesah...');
      const { error: postErr } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        image_url: finalImageUrl,
        parent_id: null,
      });

      if (postErr) throw postErr;

      navigation.goBack();
    } catch (err) {
      Alert.alert('Gagal Mengirim', err.message || 'Terjadi kesalahan saat memposting tweet.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const renderImagePreviews = () => {
    if (selectedImages.length === 0) return null;

    if (selectedImages.length === 1) {
      return (
        <View style={styles.previewContainer}>
          <View style={[styles.singlePreviewWrapper, { borderColor: theme.glassBorder }]}>
            <Image
              source={{ uri: selectedImages[0].uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveImage(0)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 2 atau lebih foto: tampilkan grid 2 kolom
    return (
      <View style={styles.previewContainer}>
        <View style={styles.gridPreviewContainer}>
          {selectedImages.map((img, idx) => (
            <View
              key={`${img.uri}-${idx}`}
              style={[
                styles.gridImageItem,
                {
                  borderColor: theme.glassBorder,
                  backgroundColor: theme.glassElevated,
                },
              ]}
            >
              <Image
                source={{ uri: img.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveImage(idx)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <GlassBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={styles.keyboardView}
      >
        {/* Custom Header Bar */}
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
              styles.backButton,
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

          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Tulis Keluh Kesah
          </Text>

          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Panel Form Kaca */}
          <View
            style={[
              styles.cardForm,
              {
                backgroundColor: theme.glassSurface,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            {/* Input Teks */}
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.textPrimary,
                },
              ]}
              multiline
              textAlignVertical="top"
              placeholder="Tulis unek-unek atau celetukanmu..."
              placeholderTextColor={theme.textSecondary}
              value={content}
              onChangeText={setContent}
              maxLength={MAX_CHARS + 50}
              autoFocus
            />

            {/* Character Counter */}
            <View style={styles.counterRow}>
              <Text
                style={[
                  styles.counterText,
                  {
                    color: isOverLimit
                      ? '#EF4444'
                      : charCount > 450
                      ? '#F59E0B'
                      : theme.textSecondary,
                    fontWeight: charCount > 450 ? '700' : '400',
                  },
                ]}
              >
                {charCount}/{MAX_CHARS}
              </Text>
            </View>

            {/* Preview Multi-Foto yang dipilih */}
            {renderImagePreviews()}

            {/* Tombol Kamera & Galeri */}
            {selectedImages.length < MAX_IMAGES && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.mediaActionBtn,
                    {
                      backgroundColor: theme.glassElevated,
                      borderColor: theme.glassBorder,
                    },
                  ]}
                  onPress={handleTakePhoto}
                >
                  <Camera size={16} color={theme.accent} />
                  <Text style={[styles.mediaActionText, { color: theme.textPrimary }]}>
                    Buka Kamera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.mediaActionBtn,
                    {
                      backgroundColor: theme.glassElevated,
                      borderColor: theme.glassBorder,
                    },
                  ]}
                  onPress={handlePickImages}
                >
                  <ImageIcon size={16} color={theme.accent} />
                  <Text style={[styles.mediaActionText, { color: theme.textPrimary }]}>
                    {selectedImages.length === 0
                      ? 'Pilih dari Galeri'
                      : `+ Galeri (${selectedImages.length}/${MAX_IMAGES})`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Status Message saat loading */}
          {Boolean(statusMessage) && (
            <Text style={[styles.statusText, { color: theme.accent }]}>
              {statusMessage}
            </Text>
          )}

          {/* Tombol Kirim */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!canSubmit}
            style={[
              styles.sendButton,
              {
                backgroundColor: canSubmit ? theme.accent : theme.glassBorder,
                opacity: canSubmit ? 1 : 0.6,
              },
            ]}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <>
                <Send size={18} color={theme.onAccent} />
                <Text
                  style={[styles.sendButtonText, { color: theme.onAccent }]}
                >
                  Kirim Anonim
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
  },
  cardForm: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
    marginBottom: 10,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  counterText: {
    fontSize: 12,
  },
  previewContainer: {
    marginBottom: 14,
  },
  singlePreviewWrapper: {
    position: 'relative',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 220,
  },
  gridPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridImageItem: {
    position: 'relative',
    width: '48.5%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  mediaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  mediaActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

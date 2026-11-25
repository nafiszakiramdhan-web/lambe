import { Platform, Share, Alert } from 'react-native';

/**
 * Membagikan teks/ringkasan postingan anonim beserta deep link / URL
 * Menggunakan Share.share di mobile (Android/iOS)
 * Menggunakan navigator.share dengan fallback salin ke clipboard di Web
 *
 * @param {Object} post - Objek tweet/postingan yang akan dibagikan
 * @returns {Promise<boolean>}
 */
export const sharePost = async (post) => {
  if (!post) return false;

  const username = post.username || 'anonim';
  const rawContent = (post.content || '').trim();
  const summary =
    rawContent.length > 140
      ? `${rawContent.slice(0, 137)}...`
      : rawContent;

  const deepLink = `lambeapp://post/${post.id}`;
  const webBase =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}${window.location.pathname.startsWith('/lambe') ? '/lambe' : ''}`
      : 'https://nafiszakiramdhan-web.github.io/lambe';
  const webLink = `${webBase}/post/${post.id}`;

  const shareTitle = `LAMBE: Keluh Kesah @${username}`;
  const shareMessage = `"${summary}"\n— @${username} di LAMBE (Anonim Keluh Kesah)\n\nBuka di aplikasi:\n${deepLink}\nAtau kunjungi web:\n${webLink}`;

  // 1. Lingkungan Web (Browser)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Coba navigator.share jika didukung (misal di Chrome Mobile / Safari)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareMessage,
          url: webLink,
        });
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
      }
    }

    // Fallback Web: Salin teks ke Clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
        Alert.alert(
          'Tautan Disalin!',
          'Ringkasan postingan dan tautan LAMBE berhasil disalin ke clipboard.'
        );
        return true;
      }
    } catch (clipErr) {
      console.warn('Gagal menyalin ke clipboard web:', clipErr);
    }
  }

  // 2. Lingkungan Mobile (React Native Share.share)
  try {
    const result = await Share.share(
      {
        title: shareTitle,
        message: shareMessage,
        url: Platform.OS === 'ios' ? deepLink : undefined,
      },
      {
        dialogTitle: `Bagikan Keluh Kesah @${username}`,
      }
    );

    return result.action === Share.sharedAction;
  } catch (error) {
    console.warn('Gagal membuka dialog bagikan:', error);
    Alert.alert(
      'Gagal Membagikan',
      'Tidak dapat membuka menu bagikan di perangkat ini.'
    );
    return false;
  }
};

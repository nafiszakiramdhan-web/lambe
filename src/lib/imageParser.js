/**
 * Helper untuk mem-parsing kolom image_url pada tabel posts.
 * Mendukung format URL tunggal ("https://...") maupun format array JSON ('["https://...", "https://..."]')
 * Mengembalikan array of string URL gambar.
 */
export const parseImages = (imageUrl) => {
  if (!imageUrl) return [];
  if (Array.isArray(imageUrl)) return imageUrl.filter(Boolean);

  if (typeof imageUrl === 'string') {
    const trimmed = imageUrl.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => typeof item === 'string' && item.length > 0);
        }
      } catch (e) {
        return [];
      }
      return [];
    }
    if (trimmed.length > 0) {
      return [trimmed];
    }
  }

  return [];
};

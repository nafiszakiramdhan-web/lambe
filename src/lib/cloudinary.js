import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ENV } from '../config/env';

const MAX_IMAGE_SELECTION = 4;

/**
 * Membuka kamera perangkat secara langsung tanpa layar crop (allowsEditing: false),
 * mengompresi gambar (maxWidth: 1080, compress: 0.7, format JPEG) dan menyertakan base64.
 * Mengembalikan objek { uri, width, height, base64 } atau null jika dibatalkan.
 */
export const takePhotoWithCamera = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Izin akses kamera diperlukan untuk mengambil foto langsung.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    base64: true,
    quality: 0.7,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const actions = [];
  if (asset.width && asset.width > 1080) {
    actions.push({ resize: { width: 1080 } });
  } else if (!asset.width) {
    actions.push({ resize: { width: 1080 } });
  }

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    actions,
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  return {
    uri: manipulated.uri,
    width: manipulated.width,
    height: manipulated.height,
    base64: manipulated.base64 || asset.base64 || null,
  };
};

/**
 * Membuka galeri perangkat tanpa layar crop (allowsEditing: false),
 * mendukung multi-seleksi (hingga 4 foto), dan mengaktifkan base64: true.
 * Mengompresi setiap gambar (maxWidth: 1080, compress: 0.7, format JPEG) dan menyertakan base64.
 * Mengembalikan array objek [{ uri, width, height, base64 }, ...].
 */
export const pickAndCompressImages = async (maxSelection = MAX_IMAGE_SELECTION) => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Izin akses galeri diperlukan untuk melampirkan foto.');
  }

  const limit = Math.max(1, Math.min(MAX_IMAGE_SELECTION, maxSelection));

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false, // Hilangkan layar crop bawaan
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.7,
    base64: true, // Pastikan base64 diminta langsung dari ImagePicker
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return [];
  }

  const compressedList = await Promise.all(
    result.assets.slice(0, limit).map(async (asset) => {
      const actions = [];
      if (asset.width && asset.width > 1080) {
        actions.push({ resize: { width: 1080 } });
      } else if (!asset.width) {
        actions.push({ resize: { width: 1080 } });
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        actions,
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      return {
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
        base64: manipulated.base64 || asset.base64 || null,
      };
    })
  );

  return compressedList;
};

/**
 * Kompatibilitas mundur: Memilih & mengompresi 1 foto tanpa crop.
 */
export const pickAndCompressImage = async () => {
  const list = await pickAndCompressImages(1);
  return list.length > 0 ? list[0] : null;
};

/**
 * Mengunggah satu gambar ke Cloudinary Unsigned endpoint menggunakan fetch + application/x-www-form-urlencoded.
 * Murni tanpa FormData dan tanpa FileSystem (mencegah error "Cannot read property 'MULTIPART' of undefined").
 * Hanya menyertakan parameter 'file' dan 'upload_preset', TANPA 'api_key' atau 'signature'.
 */
export const uploadImageToCloudinary = async (imageInput) => {
  if (!imageInput) {
    throw new Error('Gambar tidak ditemukan.');
  }

  const cloudName = (ENV.CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadPreset = (ENV.CLOUDINARY_UPLOAD_PRESET || '').trim();

  if (!cloudName || cloudName.includes('[TEMPEL') || cloudName === 'YOUR_CLOUD_NAME') {
    throw new Error(
      'Cloudinary Cloud Name belum dikonfigurasi di src/config/env.js. Harap pastikan CLOUDINARY_CLOUD_NAME terisi nama cloud Cloudinary Anda yang benar (contoh: kv9n3uit).'
    );
  }

  if (!uploadPreset || uploadPreset.includes('[TEMPEL') || uploadPreset === 'YOUR_UPLOAD_PRESET') {
    throw new Error(
      'Cloudinary Upload Preset belum dikonfigurasi di src/config/env.js. Harap pastikan CLOUDINARY_UPLOAD_PRESET terisi lambe_unsigned.'
    );
  }

  let base64String = '';

  // 1. Jika objek imageInput sudah memiliki base64
  if (typeof imageInput === 'object' && imageInput?.base64) {
    base64String = imageInput.base64;
  }
  // 2. Jika string sudah berformat data URI
  else if (typeof imageInput === 'string' && imageInput.startsWith('data:image')) {
    const parts = imageInput.split(',');
    base64String = parts[1] || '';
  }
  // 3. Jika hanya ada URI, manipulasi ke base64
  else {
    const uri = typeof imageInput === 'object' ? imageInput?.uri : imageInput;
    if (!uri) {
      throw new Error('URI gambar tidak valid.');
    }

    const manip = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manip?.base64) {
      throw new Error('Gagal mengonversi gambar ke base64.');
    }
    base64String = manip.base64;
  }

  if (!base64String) {
    throw new Error('Data gambar base64 kosong.');
  }

  const fileDataUri = `data:image/jpeg;base64,${base64String}`;

  // Bentuk body x-www-form-urlencoded menggunakan URLSearchParams
  // Hanya membawa parameter 'file' dan 'upload_preset', TANPA api_key atau signature
  const params = new URLSearchParams();
  params.append('file', fileDataUri);
  params.append('upload_preset', uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      'Gagal mengunggah foto ke Cloudinary.';
    throw new Error(errorMsg);
  }

  if (!data?.secure_url) {
    throw new Error('Cloudinary tidak mengembalikan URL gambar (secure_url).');
  }

  return data.secure_url;
};

/**
 * Mengunggah sekumpulan gambar ke Cloudinary secara berurutan dan mengembalikan array secure_url.
 */
export const uploadMultipleImagesToCloudinary = async (images = [], onProgress) => {
  if (!images || images.length === 0) return [];

  const urls = [];
  for (let i = 0; i < images.length; i++) {
    if (onProgress) {
      onProgress(i + 1, images.length);
    }
    const secureUrl = await uploadImageToCloudinary(images[i]);
    urls.push(secureUrl);
  }
  return urls;
};

/**
 * Helper: Buka galeri tanpa crop -> Kompresi -> Unggah ke Cloudinary -> Return secure_url
 */
export const pickAndUploadImage = async () => {
  const compressed = await pickAndCompressImage();
  if (!compressed) return null;

  const secureUrl = await uploadImageToCloudinary(compressed);
  return secureUrl;
};

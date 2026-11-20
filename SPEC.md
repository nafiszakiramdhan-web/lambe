# LAMBE — Project Blueprint & Technical Specification (`SPEC.md`)

> **Instruksi untuk AI Agent (OpenCode & Antigravity):**
> Baca dokumen ini secara menyeluruh sebelum menulis atau mengubah kode apa pun. Dokumen ini adalah *Single Source of Truth* untuk aplikasi **LAMBE**. Dilarang keras menambahkan fitur di luar spesifikasi ini (seperti sistem pertemanan, profil publik, *follow*, DM, atau mode privat).

---

## 1. Identitas & Konsep Produk
- **Nama Aplikasi:** LAMBE
- **Tagline:** Ruang Keluh Kesah & Celetukan 100% Anonim
- **Platform:** Android Mobile App (`.apk`) menggunakan React Native (Expo)
- **Target Anggaran Operasional:** Rp 0 (*Free Tier* Supabase + Cloudinary + Expo EAS)
- **Prinsip Utama:**
  1. **100% Anonim di Antarmuka & API Publik:** Setiap akun wajib memiliki **`@username` samaran unik** (3–20 karakter: huruf kecil `a-z`, angka `0-9`, dan `_`) yang tersimpan di tabel `profiles`. Namun, tetap **TIDAK ADA halaman profil publik**, tidak ada foto profil/avatar, tidak ada bio, tidak ada daftar teman, tidak ada follower/following, dan `@username` **tidak dapat diklik** untuk membuka halaman profil apa pun. Semua postingan menampilkan `@username` pengirim tanpa identitas asli.
  2. **1 Email = 1 Akun & Autentikasi Fleksibel:** 
     - **Email & Password:** Lengkap dengan ikon lihat/sembunyikan sandi, konfirmasi sandi saat pendaftaran, serta fitur lupa sandi/pemulihan kata sandi (`resetPasswordForEmail`).
     - **Google OAuth:** Masuk instan tanpa perlu sandi baru via `expo-web-browser` & `expo-auth-session` (`lambeapp://`), tanpa mengambil atau mengekspos nama, email, maupun foto profil Google ke publik.
  3. **Fokus Teks + Foto Opsional:** Pengguna hanya dapat menulis *tweet*/keluh kesah (maksimal 500 karakter), melampirkan 1 foto opsional, memberikan *Like*, membalas di thread, dan menghapus postingannya sendiri.

---

## 2. Tech Stack & Konfigurasi Layanan (Wajib Dipatuhi)
- **Frontend Framework:** React Native dengan Expo SDK terbaru (JavaScript / JSX, *Blank Template*).
- **Navigasi:** `@react-navigation/native` + `@react-navigation/native-stack` (tanpa *bottom tabs* rumit; gunakan *header* ringkas + tombol *floating* atau *header action* untuk membuat *tweet*).
- **Iconography:** `lucide-react-native` + `react-native-svg`.
- **Penyimpanan Lokal:** `@react-native-async-storage/async-storage` (untuk sesi login Supabase dan preferensi tema pengguna).
- **Backend & Database:** Supabase (`@supabase/supabase-js` + `react-native-url-polyfill/auto`).
  - **Project ID:** `cxmmwwarzystlxmeznlk`
  - **Project URL:** `https://cxmmwwarzystlxmeznlk.supabase.co`
  - **Publishable Key:** `sb_publishable_p70GvkPd2nK6sKNnzBWJIw_05KHMs3c`
- **Media Storage (Foto Opsional):** Cloudinary (*Unsigned Upload* langsung dari *client* setelah kompresi).
  - **Cloud Name:** `kv9n3uit`
  - **Upload Preset:** `lambe_unsigned` (mode *Unsigned*).
  - **Kompresi Wajib:** Sebelum diunggah ke Cloudinary, foto **wajib** dikompresi di HP menggunakan `expo-image-manipulator` (`maxWidth: 1080`, `compress: 0.7`, format JPEG) agar hemat kuota dan cepat dimuat.

---

## 3. Struktur Folder & File Proyek
Proyek berada di direktori `Downloads/lambe-app` dengan struktur tepat sebagai berikut:

```text
lambe-app/
├── App.js
├── SPEC.md
├── src/
│   ├── config/
│   │   └── env.js                # Menyimpan URL Supabase, Publishable Key, Cloud Name, & Upload Preset
│   ├── theme/
│   │   └── themes.js             # Definisi token warna Dark/Light Mode + 5 Warna Aksen
│   ├── context/
│   │   └── ThemeContext.js       # State global tema + persistensi AsyncStorage
│   ├── lib/
│   │   ├── supabase.js           # Inisialisasi client Supabase dengan AsyncStorage
│   │   └── cloudinary.js         # Fungsi pilih gambar, kompresi, & upload ke Cloudinary
│   ├── components/
│   │   ├── GlassBackground.js    # Ambient glow wrapper
│   │   ├── PostCard.js           # Kartu tweet (@username, badge Kamu, teks, foto, like, reply, hapus)
│   │   ├── ThemeModal.js         # Modal cepat untuk ganti Dark/Light Mode & 5 Warna Aksen
│   │   └── UsernameModal.js      # Modal ganti @username samaran kapan saja
│   └── screens/
│       ├── AuthScreen.js         # Layar Masuk, Daftar, Lupa Sandi, & Google OAuth
│       ├── UsernameSetupScreen.js# Layar pilih nama samaran awal setelah login/daftar
│       ├── FeedScreen.js         # Linimasa utama tweet anonim terbaru + badge @username
│       ├── CreatePostScreen.js   # Form tulis tweet (max 500 char) + lampiran foto opsional
│       └── ThreadScreen.js       # Detail tweet utama + daftar & input balasan anonim
└── supabase/
    └── migrations/
        └── 20261120150000_init_lambe.sql
```

---

## 4. Skema Database & Keamanan (Supabase PostgreSQL)
Database terdiri atas tabel `profiles`, `posts`, `likes`, `anon_tweets` view, dan RLS:

```sql
-- 1. Auto-confirm user baru agar langsung bisa login tanpa menunggu email verifikasi
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- 2. Tabel profiles (Hanya menyimpan nama samaran @username unik, tanpa avatar/bio)
CREATE TABLE public.profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20 AND username ~ '^[a-z0-9_]+$'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel utama tweet & balasan anonim
CREATE TABLE public.posts (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  image_url TEXT,
  parent_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel like (1 akun maksimal 1 like per tweet)
CREATE TABLE public.likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- 5. View publik yang menampilkan @username samaran tetapi menyembunyikan user_id pengirim asli
CREATE OR REPLACE VIEW public.anon_tweets AS
SELECT 
  p.id,
  CASE WHEN p.user_id = auth.uid() THEN p.user_id ELSE NULL END AS author_id,
  (p.user_id = auth.uid()) AS is_mine,
  COALESCE(pr.username, 'anonim') AS username,
  p.content,
  p.image_url,
  p.parent_id,
  (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id) AS like_count,
  EXISTS (SELECT 1 FROM public.likes l WHERE l.post_id = p.id AND l.user_id = auth.uid()) AS is_liked,
  (SELECT COUNT(*) FROM public.posts r WHERE r.parent_id = p.id) AS reply_count,
  p.created_at
FROM public.posts p
LEFT JOIN public.profiles pr ON p.user_id = pr.user_id;

-- 6. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone logged in can read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone logged in can read posts" ON public.posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users create own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone logged in can read likes" ON public.likes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);
```

### Aturan Query dari Client (Penting!)
- **Membaca Linimasa Utama:** Query ke `supabase.from('anon_tweets').select('*').is('parent_id', null).order('created_at', { ascending: false })`.
- **Membaca Balasan Thread:** Query ke `supabase.from('anon_tweets').select('*').eq('parent_id', postId).order('created_at', { ascending: true })`.
- **Membuat Tweet / Balasan:** Insert langsung ke tabel `posts` (`user_id`, `content`, `image_url`, `parent_id`).
- **Menghapus Tweet:** Hanya tampilkan tombol hapus jika `item.is_mine === true`, lalu delete dari tabel `posts` berdasarkan `id`.

---

## 5. Sistem Desain, UI, & Multi-Tema (Dark/Light + 5 Aksen)
Aplikasi harus mendukung pergantian **Mode Latar (`dark` / `light`)** dan **5 Warna Aksen** secara *real-time* melalui ikon palet di *header* `FeedScreen`:

### Token Warna Dasar
- **Dark Mode (`dark`):**
  - `bg`: `#0B0B0C`
  - `surface`: `#141417`
  - `border`: `#26262C`
  - `text`: `#F4F4F6`
  - `muted`: `#8E8E99`
- **Light Mode (`light`):**
  - `bg`: `#F6F5F2`
  - `surface`: `#FFFFFF`
  - `border`: `#E2DFD7`
  - `text`: `#141416`
  - `muted`: `#6E6D73`

### 5 Pilihan Warna Aksen
1. **`lime` (Acid Lime):** `accent: '#C8FF2E'`, `accentText: '#0B0B0C'` *(pada Light Mode gunakan `#65A30D` dengan `accentText: '#FFFFFF'` agar kontras terbaca)*
2. **`amber` (Amber Signal):** `accent: '#F59E0B'`, `accentText: '#11100F'`
3. **`violet` (Electric Violet):** `accent: '#8B5CF6'`, `accentText: '#FFFFFF'`
4. **`crimson` (Vermilion Red):** `accent: '#EF4444'`, `accentText: '#FFFFFF'`
5. **`pink` (Rose Pink — Varian Perempuan):** `accent: '#F472B6'`, `accentText: '#141416'` *(pada Light Mode gunakan `#EC4899` dengan `accentText: '#FFFFFF'`)*

### Panduan Micro-Copy (Bahasa Indonesia Santai & Jujur)
- **Header Utama:** `LAMBE` dengan badge kecil `100% Anonim` + *pill badge* `@username` milik pengguna aktif (bisa ditekan untuk ganti nama samaran kapan saja).
- **Nama Pengirim di Semua Kartu:** `@${post.username || 'anonim'}` (tambahkan tag kecil `Kamu` jika `is_mine === true`). Tidak ada tautan ke profil.
- **Placeholder Tulis Tweet:** *"Tulis unek-unek atau celetukanmu..."*
- **Placeholder Balasan:** *"Balas secara anonim..."*

---

## 6. Batasan Keras untuk AI Agent (Anti-Halusinasi)
1. **Jangan gunakan TypeScript (`.ts`/`.tsx`):** Gunakan JavaScript murni (`.js`/`.jsx`) sesuai template proyek agar tidak terjadi error konfigurasi *tsconfig*.
2. **Jangan gunakan NativeWind / Tailwind CSS jika berisiko konflik versi Expo:** Gunakan `StyleSheet.create` bawaan React Native yang menerima objek tema dinamis dari `useTheme()`. Ini menjamin 100% kompatibilitas saat di-build menjadi `.apk`.
3. **Jangan tambahkan fitur ekstra:** Tidak ada halaman Profil user, tidak ada halaman Pencarian User, tidak ada daftar Teman, dan tidak ada Notifikasi Push.
4. **Tangani Keyboard & Safe Area dengan rapi:** Gunakan `SafeAreaView` dari `react-native-safe-area-context` dan `KeyboardAvoidingView` pada `AuthScreen`, `CreatePostScreen`, dan `ThreadScreen`.
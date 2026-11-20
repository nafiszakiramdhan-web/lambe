# DESIGN.md — Panduan Desain UI Glassmorphism (LAMBE)

> **Instruksi untuk AI Agent (OpenCode & Antigravity):**
> Gunakan dokumen ini sebagai acuan utama saat merakit seluruh komponen visual (`AuthScreen`, `FeedScreen`, `CreatePostScreen`, `ThreadScreen`, `PostCard`, dan `ThemeModal`). Jangan mengubah konsep ke desain flat solid biasa—pertahankan karakteristik **Frosted Glass + Soft Ambient Glow + Floating Pill Dock**.

---

## 1. Filosofi Visual Utama
- **Gaya Desain:** Modern Dark/Light Glassmorphism (kaca buram transparan dengan pantulan tepi halus dan pendar cahaya lembut di latar belakang).
- **Kesan yang Dicari:** Ringan, intim, misterius, dan nyaman dipakai mengetik keluh kesah kapan saja (baik tengah malam maupun siang hari).
- **Aturan Anti-Bloat:** Tetap minimalis seperti microblog/tweet. Jangan menambahkan grafik berat, animasi berlebihan, atau kartu berlapis-lapis yang bikin HP kentang lag saat scrolling.

---

## 2. Token Warna & Transparansi Kaca (`src/theme/themes.js`)

### A. Mode Latar (`mode`: `'dark'` | `'light'`)
1. **Dark Mode (`dark`):**
   - `bgBase`: `'#09090B'` (Hitam pekat dasar di balik glow)
   - `glassSurface`: `'rgba(24, 24, 29, 0.68)'` (Permukaan kartu kaca transparan)
   - `glassElevated`: `'rgba(34, 34, 42, 0.82)'` (Untuk modal & floating dock)
   - `glassBorder`: `'rgba(255, 255, 255, 0.11)'` (Garis tepi kaca tipis)
   - `glassHighlight`: `'rgba(255, 255, 255, 0.18)'` (Highlight tepi atas/fokus input)
   - `textPrimary`: `'#F4F4F6'`
   - `textSecondary`: `'#9CA3AF'`
   - `blurTint`: `'dark'`

2. **Light Mode (`light`):**
   - `bgBase`: `'#F3F2EE'` (Kertas lembut di balik glow)
   - `glassSurface`: `'rgba(255, 255, 255, 0.72)'` (Kaca putih susu transparan)
   - `glassElevated`: `'rgba(255, 255, 255, 0.88)'` (Untuk modal & floating dock)
   - `glassBorder`: `'rgba(0, 0, 0, 0.08)'` (Garis tepi kaca halus)
   - `glassHighlight`: `'rgba(255, 255, 255, 0.95)'`
   - `textPrimary`: `'#141416'`
   - `textSecondary`: `'#6B7280'`
   - `blurTint`: `'light'`

### B. 5 Pilihan Warna Aksen (`accentKey`)
Setiap aksen memiliki warna utama (`accent`), warna teks di atas tombol aksen (`onAccent`), dan warna pendar cahaya latar belakang (`glow`):
1. **`lime` (Acid Lime):**
   - Dark: `accent: '#C8FF2E'`, `onAccent: '#09090B'`, `glow: 'rgba(200, 255, 46, 0.16)'`
   - Light: `accent: '#65A30D'`, `onAccent: '#FFFFFF'`, `glow: 'rgba(101, 163, 13, 0.14)'`
2. **`amber` (Amber Signal):**
   - Dark: `accent: '#F59E0B'`, `onAccent: '#09090B'`, `glow: 'rgba(245, 158, 11, 0.18)'`
   - Light: `accent: '#D97706'`, `onAccent: '#FFFFFF'`, `glow: 'rgba(217, 119, 6, 0.14)'`
3. **`violet` (Electric Violet):**
   - Dark: `accent: '#8B5CF6'`, `onAccent: '#FFFFFF'`, `glow: 'rgba(139, 92, 246, 0.22)'`
   - Light: `accent: '#7C3AED'`, `onAccent: '#FFFFFF'`, `glow: 'rgba(124, 58, 237, 0.14)'`
4. **`crimson` (Vermilion Red):**
   - Dark: `accent: '#EF4444'`, `onAccent: '#FFFFFF'`, `glow: 'rgba(239, 68, 68, 0.20)'`
   - Light: `accent: '#DC2626'`, `onAccent: '#FFFFFF'`, `glow: 'rgba(220, 38, 38, 0.14)'`
5. **`pink` (Rose Pink — Varian Perempuan):**
   - Dark: `accent: '#F472B6'`, `onAccent: '#09090B'`, `glow: 'rgba(244, 114, 182, 0.22)'`
   - Light: `accent: '#EC4899'`, `onAccent: '#FFFFFF'`, `glow: 'rgba(236, 72, 153, 0.16)'`

---

## 3. Arsitektur Komponen Visual (Wajib Diterapkan)

### 1. Background Ambient Glow (`GlassBackground` Wrapper)
- Bungkus setiap layar dengan latar dasar `bgBase` dan letakkan **2 lingkaran/blob gradasi lembut** menggunakan `expo-linear-gradient` (satu di pojok kiri atas dengan warna `glow`, satu lagi samar di kanan bawah) dengan `pointerEvents="none"`.
- Ini kunci agar permukaan kaca transparan (`glassSurface`) terlihat benar-benar tembus cahaya di semua layar.

### 2. Kartu Tweet Kaca (`PostCard.js`)
- **Bentuk:** `borderRadius: 20`, `backgroundColor: theme.glassSurface`, `borderWidth: 1`, `borderColor: theme.glassBorder`, `padding: 16`, `marginBottom: 12`.
- **Header Kartu:**
  - Avatar kapsul/lingkaran kecil kaca (`34x34`) berisi ikon topeng/ghost atau inisial `?` dengan tint `accent`.
  - Label pengirim: **`@${post.username || 'anonim'}`** (tebal, teks biasa tanpa link ke profil publik). Jika `is_mine === true`, tampilkan pill badge kecil bertuliskan **`Kamu`** dengan latar `accent` transparan.
  - Waktu relatif di sisi kanan (misal: `2m lalu`, `1j lalu`) dengan warna `textSecondary`.
  - Tombol ikon tempat sampah kecil di pojok kanan atas **hanya jika `is_mine === true`**.
- **Isi Konten:**
  - Teks utama (`fontSize: 15`, `lineHeight: 22`, warna `textPrimary`).
  - Jika `image_url` ada: tampilkan gambar dengan `borderRadius: 14`, `aspectRatio: 4/3` atau `maxHeight: 260`, `borderWidth: 1`, `borderColor: theme.glassBorder`.
- **Footer Aksi:**
  - Tombol **Like** (ikon hati + angka): jika `is_liked === true`, ikon dan angka berubah ke warna `accent`.
  - Tombol **Balas** (ikon pesan + angka `reply_count`): membuka `ThreadScreen`.

### 3. Floating Glass Header & Floating Capsule Dock (`FeedScreen.js`)
- **Top Glass Bar:** Menggunakan `BlurView` (`intensity={35}`, `tint={theme.blurTint}`) yang melayang di atas list. Berisi logo teks **`LAMBE`** + badge kecil `100% Anonim`, serta *pill badge* kaca **`@username`** milik pengguna aktif dengan ikon pensil kecil (dapat ditekan untuk membuka `UsernameModal` ganti nama samaran). Di sisi kanan terdapat tombol bulat kaca untuk **Ganti Tema (ikon Palette)** dan **Keluar/Logout (ikon LogOut)**.
- **Bottom Floating Capsule Dock:** Bilah kapsul melayang di bagian bawah layar (`position: 'absolute'`, `bottom: 24`, `alignSelf: 'center'`, `borderRadius: 999`, `overflow: 'hidden'`, `borderWidth: 1`, `borderColor: theme.glassHighlight`) menggunakan `BlurView` (`intensity={50}`):
  - Berisi tombol bulat utama berwarna `accent` dengan ikon **`+` (Tulis Keluh Kesah)** dan label singkat **`Tulis Tweet`** agar mudah dijangkau satu jempol.

### 4. Modal & Layar Pengaturan Nama Samaran (`UsernameSetupScreen.js` & `UsernameModal.js`)
- **UsernameSetupScreen:** Muncul setelah login/daftar jika pengguna belum memiliki nama samaran di tabel `profiles`. Memiliki input field bergaya kaca, prefix `@`, otomatis huruf kecil (`a-z`, `0-9`, `_`, 3-20 karakter), tombol "Acak" untuk ide nama samaran, dan tombol "Mulai Melampiaskan Unek-Unek".
- **UsernameModal:** Bottom sheet kaca (`BlurView`) yang dipicu dari header Feed untuk mengganti `@username` kapan saja tanpa merusak anonimitas.

### 5. Modal Pemilih Tema Kaca (`ThemeModal.js`)
- Muncul sebagai *bottom sheet* kaca buram (`BlurView intensity={65}`, `borderTopLeftRadius: 28`, `borderTopRightRadius: 28`).
- **Bagian 1 — Mode Tampilan:** Dua tombol kapsul berdampingan: **Dark Mode** (ikon Bulan) dan **Light Mode** (ikon Matahari).
- **Bagian 2 — Warna Aksen:** 5 lingkaran/kapsul warna interaktif (**Acid Lime**, **Amber Signal**, **Electric Violet**, **Vermilion Red**, **Rose Pink**) dengan cincin indikator aktif di warna yang sedang dipilih.

### 6. Layar Tulis Tweet & Thread (`CreatePostScreen.js` & `ThreadScreen.js`)
- **CreatePostScreen:** Area ketik di dalam panel kaca besar, penghitung karakter real-time (`0/500`), tombol kapsul kaca **"Tambah Foto"** (dengan preview gambar & tombol `X` untuk batal), dan tombol kirim kapsul penuh berwarna `accent`. Dilengkapi penanganan `KeyboardAvoidingView` yang rapi.
- **ThreadScreen:** Menampilkan `PostCard` utama di atas, daftar balasan di tengah, dan *input bar* kaca melayang di bawah untuk membalas cepat. Menggunakan `KeyboardAvoidingView` sehingga saat keyboard terbuka, input bar otomatis terangkat di atas keyboard tanpa terpotong atau tertutup.

---

## 4. Aturan Performa React Native (Expo)
- Jangan memasang `BlurView` di dalam setiap item `FlatList` (`PostCard`), karena terlalu banyak `BlurView` di dalam daftar gulir bisa menurunkan FPS di Android.
- Gunakan `BlurView` **hanya** pada elemen statis/melayang (**Top Header**, **Bottom Floating Capsule**, **Bottom Input Bar**, dan **ThemeModal**).
- Untuk `PostCard`, gunakan permukaan kaca semi-transparan (`backgroundColor: theme.glassSurface` + `borderColor: theme.glassBorder`) di atas `GlassBackground`—hasilnya tetap terlihat seperti kaca transparan namun tetap 60 FPS saat scrolling panjang.
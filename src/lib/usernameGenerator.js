// Helper generator nama samaran acak unik untuk LAMBE
// Aturan: 3-20 karakter, huruf kecil (a-z), angka (0-9), dan garis bawah (_)

const ADJECTIVES = [
  'si',
  'kang',
  'bocah',
  'sobat',
  'warga',
  'netizen',
  'pejuang',
  'kaum',
  'kucing',
  'celetuk',
  'hantu',
  'anon',
  'juragan',
  'sultan',
  'anak',
];

const NOUNS = [
  'santai',
  'senja',
  'kepo',
  'galau',
  'nyinyir',
  'ghibah',
  'curhat',
  'ngantuk',
  'silent',
  'oren',
  'rebahan',
  'julid',
  'keluh',
  'kopi',
  'misteri',
];

export const generateRandomUsername = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 900); // 2-3 digit

  let username = `${adj}_${noun}_${num}`.toLowerCase();
  if (username.length > 20) {
    username = username.substring(0, 20);
  }
  return username;
};

export const sanitizeUsername = (text = '') => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 20);
};

export const validateUsername = (username = '') => {
  if (!username || username.length < 3) {
    return 'Nama samaran minimal 3 karakter.';
  }
  if (username.length > 20) {
    return 'Nama samaran maksimal 20 karakter.';
  }
  const regex = /^[a-z0-9_]+$/;
  if (!regex.test(username)) {
    return 'Nama samaran hanya boleh berisi huruf kecil (a-z), angka (0-9), dan garis bawah (_).';
  }
  return null;
};

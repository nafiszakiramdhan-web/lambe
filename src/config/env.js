export const ENV = {
  SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://cxmmwwarzystlxmeznlk.supabase.co',
  SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_p70GvkPd2nK6sKNnzBWJIw_05KHMs3c',
  CLOUDINARY_CLOUD_NAME:
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'kv9n3uit',
  CLOUDINARY_UPLOAD_PRESET:
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'lambe_unsigned',
};

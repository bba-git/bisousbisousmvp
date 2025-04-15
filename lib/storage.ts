import { supabase } from './supabase';

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  DOCUMENTS: 'documents',
} as const;

export async function uploadFile(
  bucket: keyof typeof STORAGE_BUCKETS,
  path: string,
  file: File
) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .upload(path, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .getPublicUrl(path);

  return publicUrl;
}

export async function deleteFile(
  bucket: keyof typeof STORAGE_BUCKETS,
  path: string
) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .remove([path]);

  if (error) throw error;
} 
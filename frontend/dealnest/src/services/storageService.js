import { supabase } from '../lib/supabaseClient';

const BUCKET = 'dealnest-media';

export const storageService = {
  uploadImage: async (file, folder) => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw new Error(error.message || 'Failed to upload image.');
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },
};

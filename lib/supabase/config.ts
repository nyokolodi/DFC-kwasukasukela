const FALLBACK_URL = 'https://kmeinntwtbupbacxlzvd.supabase.co';
const FALLBACK_KEY = 'sb_publishable_YM-gK1r6-RTvmPZ7yKpYXA_jUBkOsqE';

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_KEY;

  return { url, key };
}

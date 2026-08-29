import { createClient } from '@/lib/supabase/server';

export type StoryCard = {
  id: string;
  slug: string;
  title: string;
  original_title: string | null;
  summary: string;
  language_name: string;
  culture_name: string | null;
  age_min: number;
  age_max: number;
  themes: string[];
  moral_lesson: string | null;
  access_level: string;
  status: string;
  published_at: string | null;
  storyteller_name: string | null;
  duration_seconds: number | null;
  audio_path: string | null;
  cover_url: string | null;
};

export async function getPublishedStories(limit?: number): Promise<{
  stories: StoryCard[];
  error: string | null;
}> {
  const db = await createClient();

  const storyQuery = db
    .from('stories')
    .select(
      'id,slug,title,original_title,summary,language_id,culture_id,storyteller_id,age_min,age_max,themes,moral_lesson,access_level,status,published_at',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const { data: rawStories, error: storyError } = await storyQuery;
  if (storyError) {
    return { stories: [], error: storyError.message };
  }

  const stories = (rawStories ?? []).slice(0, limit ?? rawStories?.length ?? 0);

  if (stories.length === 0) {
    return { stories: [], error: null };
  }

  const languageIds = [...new Set(stories.map((s) => s.language_id).filter(Boolean))];
  const cultureIds = [...new Set(stories.map((s) => s.culture_id).filter(Boolean))];
  const storytellerIds = [...new Set(stories.map((s) => s.storyteller_id).filter(Boolean))];
  const storyIds = stories.map((s) => s.id);

  const [{ data: languages }, { data: cultures }, { data: storytellers }, { data: audio }] =
    await Promise.all([
      languageIds.length
        ? db.from('languages').select('id,name').in('id', languageIds)
        : Promise.resolve({ data: [] }),
      cultureIds.length
        ? db.from('cultures').select('id,name').in('id', cultureIds)
        : Promise.resolve({ data: [] }),
      storytellerIds.length
        ? db.from('storyteller_profiles').select('id,public_name').in('id', storytellerIds)
        : Promise.resolve({ data: [] }),
      db
        .from('story_audio_assets')
        .select('story_id,duration_seconds,storage_path')
        .in('story_id', storyIds)
        .eq('variant', 'standard')
        .eq('approved', true),
    ]);

  const languageMap = new Map((languages ?? []).map((x: any) => [x.id, x.name]));
  const cultureMap = new Map((cultures ?? []).map((x: any) => [x.id, x.name]));
  const storytellerMap = new Map((storytellers ?? []).map((x: any) => [x.id, x.public_name]));
  const audioMap = new Map(
    (audio ?? []).map((x: any) => [
      x.story_id,
      { duration_seconds: x.duration_seconds ?? null, storage_path: x.storage_path ?? null },
    ]),
  );

  return {
    stories: stories.map((story: any) => {
      const audioAsset = audioMap.get(story.id);
      return {
        id: story.id,
        slug: story.slug,
        title: story.title,
        original_title: story.original_title ?? null,
        summary: story.summary,
        language_name: languageMap.get(story.language_id) ?? 'Unknown language',
        culture_name: cultureMap.get(story.culture_id) ?? null,
        age_min: story.age_min,
        age_max: story.age_max,
        themes: story.themes ?? [],
        moral_lesson: story.moral_lesson ?? null,
        access_level: story.access_level,
        status: story.status,
        published_at: story.published_at ?? null,
        storyteller_name: storytellerMap.get(story.storyteller_id) ?? null,
        duration_seconds: audioAsset?.duration_seconds ?? null,
        audio_path: audioAsset?.storage_path ?? null,
        cover_url: null,
      };
    }),
    error: null,
  };
}

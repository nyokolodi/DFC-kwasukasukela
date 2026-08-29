export type Story = {
  id: string;
  slug: string;
  title: string;
  original_title: string | null;
  summary: string;
  language_name: string;
  culture_name: string | null;
  age_min: number;
  age_max: number;
  duration_seconds: number | null;
  cover_url: string | null;
  audio_path: string | null;
  access_level: "public" | "subscriber" | "school" | "restricted";
};

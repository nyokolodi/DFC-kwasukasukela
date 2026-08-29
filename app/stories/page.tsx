import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Stories() {
  const db = await createClient();
  const { data, error } = await db.from('story_catalog').select('*').order('published_at', { ascending: false });

  return (
    <section className="section shell">
      <div className="eyebrow">African Story Library</div>
      <h1>Stories worth staying for.</h1>
      <p className="lead">Browse real voices, languages, histories, moral lessons and lullabies.</p>
      {error && <div className="status">Library is not connected yet. Run the DFC Supabase schema.</div>}

      <div className="grid">
        {(data ?? []).map((story: any) => (
          <article className="card" key={story.id}>
            <div className="chips">
              <span className="chip">{story.language_name}</span>
              {story.culture_name && <span className="chip">{story.culture_name}</span>}
            </div>
            <h2 style={{ fontSize: 24 }}>{story.title}</h2>
            <p className="muted">{story.summary}</p>
            <p className="small muted">Ages {story.age_min}–{story.age_max}</p>
            <Link className="btn secondary" href={'/stories/' + story.slug}>Open story</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

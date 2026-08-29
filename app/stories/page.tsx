import Link from 'next/link';
import { getPublishedStories } from '@/lib/story-library';

export default async function Stories() {
  const { stories, error } = await getPublishedStories();

  return (
    <section className="section shell">
      <div className="eyebrow">African Story Library</div>
      <h1>Stories worth staying for.</h1>
      <p className="lead">
        Browse real voices, languages, histories, moral lessons and lullabies.
      </p>

      {error && (
        <div className="status">
          The story library is temporarily unavailable. Please try again shortly.
        </div>
      )}

      {!error && stories.length === 0 && (
        <div className="card">
          <h2>The fire is waiting.</h2>
          <p className="muted">
            Stories are being prepared by our storyteller community.
          </p>
        </div>
      )}

      <div className="grid">
        {stories.map((story) => (
          <article className="card" key={story.id}>
            <div className="chips">
              <span className="chip">{story.language_name}</span>
              {story.culture_name && <span className="chip">{story.culture_name}</span>}
            </div>
            <h2 style={{ fontSize: 24 }}>{story.title}</h2>
            <p className="muted">{story.summary}</p>
            <p className="small muted">
              Ages {story.age_min}–{story.age_max}
            </p>
            <Link className="btn secondary" href={'/stories/' + story.slug}>
              Open story
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

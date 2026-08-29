import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPublishedStories } from '@/lib/story-library';

export default async function Home() {
  const db = await createClient();
  const [{ stories }, { data: circles }] = await Promise.all([
    getPublishedStories(6),
    db.from('fire_circles').select('id,title,description,starts_at,status').in('status', ['scheduled', 'live']).order('starts_at').limit(3),
  ]);

  return (
    <>
      <section className="hero shell">
        <div>
          <div className="eyebrow">A digital fireside for South Africa</div>
          <h1>The fire is digital. The tradition is real.</h1>
          <p className="lead">
            Digital Fire Circle reconnects children with reading, elders with purpose, and
            families with culture through real voices, real stories and respectful technology.
          </p>
          <div className="heroActions">
            <Link className="btn" href="/stories">Explore stories</Link>
            <Link className="btn secondary" href="/circles">Join a Fire Circle</Link>
          </div>
        </div>
        <div className="firecard">
          <div>
            <div className="eyebrow" style={{ color: '#f7d5a2' }}>Tonight around the fire</div>
            <h2>Listen. Learn. Belong.</h2>
            <p>Folktales, history, lullabies, language stories and wisdom carried by living storytellers.</p>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <div className="eyebrow">Story library</div>
            <h2>Stories worth staying for.</h2>
          </div>
          <Link href="/stories">View library →</Link>
        </div>

        {stories.length === 0 ? (
          <div className="card">
            <h3>The fire is waiting.</h3>
            <p className="muted">Stories are being prepared by our storyteller community.</p>
          </div>
        ) : (
          <div className="grid">
            {stories.map((story) => (
              <article className="card" key={story.id}>
                <div className="chips">
                  <span className="chip">{story.language_name}</span>
                  {story.culture_name && <span className="chip">{story.culture_name}</span>}
                </div>
                <h3>{story.title}</h3>
                <p className="muted">{story.summary}</p>
                <Link href={'/stories/' + story.slug}>Open story →</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section shell">
        <div className="eyebrow">Live circles</div>
        <h2>Gather around the fire.</h2>
        <div className="grid">
          {(circles ?? []).map((circle: any) => (
            <article className="card" key={circle.id}>
              <div className="chip">{circle.status}</div>
              <h3>{circle.title}</h3>
              <p className="muted">{circle.description}</p>
              <Link href={'/circles/' + circle.id}>Enter circle →</Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

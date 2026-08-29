import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Circles() {
  const db = await createClient();
  const { data } = await db.from('fire_circles')
    .select('id,title,description,starts_at,capacity,status')
    .in('status', ['scheduled','live'])
    .order('starts_at');

  return (
    <section className="section shell">
      <div className="eyebrow">Live Digital Fire Circles</div>
      <h1>Gather, listen, participate.</h1>
      <p className="lead">Moderated audio sessions led by vetted storytellers. No toxic chat. No algorithm chaos.</p>

      <div className="grid">
        {(data ?? []).map((circle: any) => (
          <article className="card" key={circle.id}>
            <span className="chip">{circle.status}</span>
            <h2 style={{ fontSize: 24 }}>{circle.title}</h2>
            <p className="muted">{circle.description}</p>
            <p className="small">{new Date(circle.starts_at).toLocaleString()} · Capacity {circle.capacity}</p>
            <Link className="btn" href={'/circles/' + circle.id}>Open circle</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CircleRoom from '@/components/CircleRoom';

export default async function Circle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: circle } = await db.from('fire_circles').select('*').eq('id', id).maybeSingle();

  if (!circle) notFound();

  return (
    <section className="section shell">
      <div className="card">
        <div className="eyebrow">Digital Fire Circle</div>
        <h1>{circle.title}</h1>
        <p className="lead">{circle.description}</p>
        <p className="muted">{new Date(circle.starts_at).toLocaleString()}</p>
        <CircleRoom circleId={circle.id} />
      </div>
    </section>
  );
}

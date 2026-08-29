import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function StoryOps() {
  const session = await requireRole(['platform_admin','moderator','content_manager']);
  if (!session) redirect('/manager');

  const db = await createClient();
  const { data } = await db.from('stories')
    .select('id,title,slug,status,access_level,created_at')
    .order('created_at', { ascending: false });

  async function action(form: FormData) {
    'use server';
    const db = await createClient();
    const id = String(form.get('id'));
    const actionName = String(form.get('action'));

    if (actionName === 'publish' && ['platform_admin','content_manager'].includes(session.profile.role)) {
      const { data: asset } = await db.from('story_audio_assets')
        .select('id')
        .eq('story_id', id)
        .eq('variant', 'standard')
        .eq('approved', true)
        .maybeSingle();

      if (asset) {
        await db.from('stories')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', id);
      }
    }

    if (actionName === 'approve_audio' && ['platform_admin','content_manager'].includes(session.profile.role)) {
      await db.from('story_audio_assets')
        .update({ approved: true })
        .eq('story_id', id)
        .eq('variant', 'standard');
    }
  }

  return (
    <section className="section shell">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Story operations</h1>
          <p className="lead">Review, approve audio and publish culturally responsible archive content.</p>
        </div>
        <Link className="btn" href="/manager/stories/new">New story</Link>
      </div>

      <div className="grid">
        {(data ?? []).map((story: any) => (
          <article className="card" key={story.id}>
            <span className="chip">{story.status}</span>
            <h2 style={{ fontSize: 24 }}>{story.title}</h2>
            <p className="small muted">{story.slug}</p>
            <p>Access: {story.access_level}</p>
            <form action={action} className="row">
              <input type="hidden" name="id" value={story.id} />
              <button className="btn secondary" name="action" value="approve_audio">Approve audio</button>
              <button className="btn" name="action" value="publish">Publish</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}

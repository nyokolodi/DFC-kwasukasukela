import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const pageRoles = ['platform_admin','moderator','content_manager'] as const;
const publishRoles = ['platform_admin','content_manager'] as const;

export default async function StoryOps() {
  const session = await requireRole([...pageRoles]);
  if (!session) redirect('/manager');

  const db = await createClient();
  const { data } = await db.from('stories')
    .select('id,title,slug,status,access_level,created_at')
    .order('created_at', { ascending: false });

  async function action(form: FormData) {
    'use server';

    const staff = await requireRole([...pageRoles]);
    if (!staff) redirect('/manager');

    const id = String(form.get('id') ?? '');
    const actionName = String(form.get('action') ?? '');
    const db = await createClient();

    if (actionName === 'publish' && (publishRoles as readonly string[]).includes(staff.profile.role)) {
      const { data: asset } = await db.from('story_audio_assets')
        .select('id')
        .eq('story_id', id)
        .eq('variant', 'standard')
        .eq('approved', true)
        .maybeSingle();

      if (asset) {
        const { error } = await db.from('stories')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      }
    }

    if (actionName === 'approve_audio' && (publishRoles as readonly string[]).includes(staff.profile.role)) {
      const { error } = await db.from('story_audio_assets')
        .update({ approved: true })
        .eq('story_id', id)
        .eq('variant', 'standard');

      if (error) throw error;
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

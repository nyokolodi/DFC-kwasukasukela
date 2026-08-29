import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const allowedRoles = ['platform_admin','content_manager','moderator'] as const;

export default async function NewCircle() {
  const session = await requireRole([...allowedRoles]);
  if (!session) redirect('/manager');

  async function create(form: FormData) {
    'use server';

    const staff = await requireRole([...allowedRoles]);
    if (!staff) redirect('/manager');

    const db = await createClient();
    const { error } = await db.from('fire_circles').insert({
      title: String(form.get('title') ?? ''),
      description: String(form.get('description') ?? ''),
      starts_at: String(form.get('starts_at') ?? ''),
      ends_at: form.get('ends_at') ? String(form.get('ends_at')) : null,
      status: 'scheduled',
      capacity: Number(form.get('capacity') ?? 40),
      recording_allowed: form.get('recording_allowed') === 'on',
      created_by: staff.profile.id,
    });

    if (error) throw error;
    redirect('/manager/circles');
  }

  return (
    <section className="section shell">
      <div className="card">
        <div className="eyebrow">Live operations</div>
        <h1>Schedule a Fire Circle</h1>
        <form className="form" action={create}>
          <input className="input" name="title" placeholder="Circle title" required />
          <textarea className="input" name="description" placeholder="Description" rows={4} />
          <input className="input" name="starts_at" type="datetime-local" required />
          <input className="input" name="ends_at" type="datetime-local" />
          <input className="input" name="capacity" type="number" min="1" max="10000" defaultValue="40" />
          <label><input name="recording_allowed" type="checkbox" /> Recording permitted after consent</label>
          <button className="btn">Schedule circle</button>
        </form>
      </div>
    </section>
  );
}

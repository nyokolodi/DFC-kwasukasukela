import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const allowedRoles = ['platform_admin','moderator','content_manager'] as const;

export default async function Storytellers() {
  const session = await requireRole([...allowedRoles]);
  if (!session) redirect('/manager');

  const db = await createClient();
  const { data } = await db.from('storyteller_applications').select('*').order('created_at', { ascending: false });

  async function review(form: FormData) {
    'use server';

    const staff = await requireRole([...allowedRoles]);
    if (!staff) redirect('/manager');

    const { error } = await (await createClient())
      .from('storyteller_applications')
      .update({
        status: String(form.get('status') ?? 'submitted'),
        review_notes: String(form.get('notes') ?? ''),
        reviewed_by: staff.profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', String(form.get('id') ?? ''));

    if (error) throw error;
  }

  return (
    <section className="section shell">
      <h1>Storyteller applications</h1>
      <div className="grid">
        {(data ?? []).map((application: any) => (
          <article className="card" key={application.id}>
            <span className="chip">{application.status}</span>
            <h2 style={{ fontSize: 24 }}>{application.display_name}</h2>
            <p className="muted">{application.community} · {(application.languages || []).join(', ')}</p>
            <form className="form" action={review}>
              <input type="hidden" name="id" value={application.id} />
              <input className="input" name="notes" placeholder="Review note" />
              <div className="row">
                <button className="btn" name="status" value="approved">Approve</button>
                <button className="btn secondary" name="status" value="rejected">Reject</button>
              </div>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}

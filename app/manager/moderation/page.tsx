import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const allowedRoles = ['platform_admin','moderator'] as const;

export default async function Moderation() {
  const session = await requireRole([...allowedRoles]);
  if (!session) redirect('/manager');

  const db = await createClient();
  const { data } = await db.from('content_reports')
    .select('id,reason,details,status,created_at,story_id,circle_id')
    .order('created_at', { ascending: false })
    .limit(100);

  async function resolve(form: FormData) {
    'use server';

    const staff = await requireRole([...allowedRoles]);
    if (!staff) redirect('/manager');

    const { error } = await (await createClient())
      .from('content_reports')
      .update({
        status: 'resolved',
        resolved_by: staff.profile.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', String(form.get('id') ?? ''));

    if (error) throw error;
  }

  return (
    <section className="section shell">
      <h1>Moderation queue</h1>
      <p className="lead">Human review remains in control of safety, cultural restrictions and community reports.</p>
      <div className="grid">
        {(data ?? []).map((report: any) => (
          <article className="card" key={report.id}>
            <span className="chip">{report.status}</span>
            <h2 style={{ fontSize: 22 }}>{report.reason}</h2>
            <p className="muted">{report.details || 'No additional details.'}</p>
            {report.status === 'open' && (
              <form action={resolve}>
                <input type="hidden" name="id" value={report.id} />
                <button className="btn">Resolve report</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

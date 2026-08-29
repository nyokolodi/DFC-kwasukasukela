import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const roles = [
  'family_owner','family_member','elder_applicant','storyteller','teacher',
  'school_admin','moderator','content_manager','finance_manager','platform_admin',
] as const;

export default async function People() {
  const session = await requireRole(['platform_admin','moderator','content_manager','finance_manager','school_admin']);
  if (!session) redirect('/manager');

  const db = await createClient();
  const { data } = await db.from('profiles')
    .select('id,display_name,phone,role,created_at')
    .order('created_at', { ascending: false })
    .limit(250);

  async function changeRole(form: FormData) {
    'use server';
    if (session.profile.role !== 'platform_admin') return;
    const db = await createClient();
    await db.from('profiles')
      .update({ role: String(form.get('role')) })
      .eq('id', String(form.get('id')));
  }

  return (
    <section className="section shell">
      <h1>People & roles</h1>
      <p className="lead">Platform administrators can assign operational roles. Other staff can view people but cannot escalate privileges.</p>
      <div className="grid">
        {(data ?? []).map((person: any) => (
          <article className="card" key={person.id}>
            <h2 style={{ fontSize: 21 }}>{person.display_name || 'Unnamed'}</h2>
            <p className="muted">{person.phone || 'No phone'}</p>
            <form action={changeRole} className="form">
              <input type="hidden" name="id" value={person.id} />
              <select className="input" name="role" defaultValue={person.role} disabled={session.profile.role !== 'platform_admin'}>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              {session.profile.role === 'platform_admin' && <button className="btn">Save role</button>}
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}

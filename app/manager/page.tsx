import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function Manager() {
  const session = await requireStaff();

  if (!session) {
    return (
      <section className="section shell">
        <div className="card">
          <h1>Admin access required</h1>
          <p>Sign in with your platform administrator account.</p>
          <Link className="btn" href="/login">Sign in</Link>
        </div>
      </section>
    );
  }

  const db = await createClient();
  const [{ count: profiles }, { count: stories }, { count: applications }, { count: circles }, { count: reports }] =
    await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('stories').select('*', { count: 'exact', head: true }),
      db.from('storyteller_applications').select('*', { count: 'exact', head: true }),
      db.from('fire_circles').select('*', { count: 'exact', head: true }),
      db.from('content_reports').select('*', { count: 'exact', head: true }),
    ]);

  const metrics = [
    ['Profiles', profiles],
    ['Stories', stories],
    ['Applications', applications],
    ['Fire Circles', circles],
    ['Open reports', reports],
  ] as const;

  return (
    <section className="section shell">
      <div className="eyebrow">Platform command center</div>
      <h1>DFC Admin</h1>
      <p className="lead">One place to run the archive, storytellers, families, Fire Circles, moderation and platform health.</p>

      <div className="grid">
        {metrics.map(([label, value]) => (
          <div className="card" key={label}>
            <div className="small muted">{label}</div>
            <div className="metric">{value ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="adminnav">
        <Link className="btn secondary" href="/manager/people">People</Link>
        <Link className="btn secondary" href="/manager/stories">Stories</Link>
        <Link className="btn secondary" href="/manager/storytellers">Storytellers</Link>
        <Link className="btn secondary" href="/manager/circles">Fire Circles</Link>
        <Link className="btn secondary" href="/manager/moderation">Moderation</Link>
      </div>
    </section>
  );
}

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

async function apply(formData: FormData) {
  'use server';

  const session = await requireUser();
  if (!session) redirect('/login');

  const payload = {
    user_id: session.user.id,
    display_name: String(formData.get('display_name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    languages: String(formData.get('languages') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    community: String(formData.get('community') ?? ''),
    biography: String(formData.get('biography') ?? ''),
    status: 'submitted',
  };

  const { error } = await session.supabase
    .from('storyteller_applications')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) throw error;
  redirect('/elder');
}

export default function Apply() {
  return (
    <section className="section shell">
      <div className="card">
        <div className="eyebrow">Storyteller onboarding</div>
        <h1>Bring a story to the fire.</h1>
        <form className="form" action={apply}>
          <input className="input" name="display_name" placeholder="Public storyteller name" required />
          <input className="input" name="phone" placeholder="Phone" required />
          <input className="input" name="languages" placeholder="Languages, comma separated" required />
          <input className="input" name="community" placeholder="Community / place" required />
          <textarea className="input" name="biography" rows={7} placeholder="Tell us about your storytelling, language, history or community knowledge" required />
          <button className="btn">Submit application</button>
        </form>
      </div>
    </section>
  );
}

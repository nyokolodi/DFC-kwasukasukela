import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

async function addChild(form: FormData) {
  'use server';

  const session = await requireUser();
  if (!session) redirect('/login');

  const { data: family } = await session.supabase
    .from('families')
    .select('id')
    .eq('owner_id', session.user.id)
    .maybeSingle();

  if (!family) redirect('/family');

  const languages = String(form.get('languages') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const { error } = await session.supabase
    .from('child_profiles')
    .insert({
      family_id: family.id,
      display_name: String(form.get('display_name') ?? ''),
      birth_year: Number(form.get('birth_year') ?? 0) || null,
      preferred_languages: languages,
    });

  if (error) throw error;
  redirect('/family');
}

export default function NewChild() {
  return (
    <section className="section shell">
      <div className="card">
        <div className="eyebrow">Family</div>
        <h1>Add a child</h1>
        <form className="form" action={addChild}>
          <input className="input" name="display_name" placeholder="Child name or nickname" required />
          <input className="input" name="birth_year" type="number" placeholder="Birth year" min="2000" max="2100" />
          <input className="input" name="languages" placeholder="isiZulu, English" />
          <button className="btn">Save child</button>
        </form>
      </div>
    </section>
  );
}

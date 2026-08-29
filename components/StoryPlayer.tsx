'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSupabaseConfig } from '@/lib/supabase/config';

export default function StoryPlayer({ storyId }: { storyId: string }) {
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState('Tap prepare to request protected audio.');
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function prepare() {
    if (busy) return;
    setBusy(true);
    setMsg('Checking access…');

    try {
      const db = createClient();
      const {
        data: { session },
      } = await db.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers.Authorization = 'Bearer ' + session.access_token;
      }

      const { url: supabaseUrl } = getSupabaseConfig();
      const response = await fetch(
        supabaseUrl + '/functions/v1/create-story-stream-url',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ storyId }),
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMsg(result.error || 'Sign in or obtain access to listen.');
        return;
      }

      if (!result.url) {
        setMsg('Audio service returned no playable URL.');
        return;
      }

      setUrl(result.url);
      setMsg('Protected audio ready.');

      window.setTimeout(() => {
        audioRef.current?.play().catch(() => {
          setMsg('Protected audio ready. Press play to listen.');
        });
      }, 100);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Unable to prepare audio.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ background: '#fff7ee' }}>
      <div className="eyebrow">Listen</div>
      <audio
        ref={audioRef}
        controls
        src={url || undefined}
        onError={() => setMsg('Audio could not be loaded.')}
        onPlay={() => setMsg('Listening…')}
        style={{ width: '100%', marginTop: 12 }}
      />
      <div className="heroActions">
        <button className="btn" onClick={prepare} disabled={busy}>
          {busy ? 'Preparing…' : 'Prepare protected audio'}
        </button>
      </div>
      <div className="small muted">{msg}</div>
    </div>
  );
}

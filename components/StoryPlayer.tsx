'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function StoryPlayer({ storyId }: { storyId: string }) {
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState('Tap prepare to request protected audio.');
  const audioRef = useRef<HTMLAudioElement>(null);

  async function prepare() {
    setMsg('Checking access…');

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setMsg('Supabase is not configured.');
      return;
    }

    const response = await fetch(
      supabaseUrl + '/functions/v1/create-story-stream-url',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ storyId }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setMsg(result.error || 'Sign in or obtain access to listen.');
      return;
    }

    setUrl(result.url);
    setMsg('Protected audio ready.');

    window.setTimeout(() => {
      audioRef.current?.play().catch(() => {
        setMsg('Protected audio ready. Press play to listen.');
      });
    }, 100);
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
        <button className="btn" onClick={prepare}>
          Prepare protected audio
        </button>
      </div>
      <div className="small muted">{msg}</div>
    </div>
  );
}

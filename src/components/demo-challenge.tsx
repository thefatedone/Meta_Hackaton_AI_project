'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type Turnstile = { render: (container: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: Turnstile } }

export function DemoChallenge({ attempt, onToken }: { attempt: number; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState(false);
  const [error, setError] = useState('');
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    let cancelled = false;
    fetch('/api/demo-session', { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error();
      if (!cancelled) setSession(true);
    }).catch(() => { if (!cancelled) setError('The public AI demo is not ready. You can enter your requirements manually.'); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    callback.current('');
    if (!sitekey || !loaded || !session || !container.current || !window.turnstile) return;
    const widget = window.turnstile.render(container.current, {
      sitekey, action: 'analyze', size: 'flexible',
      callback: (token: string) => { setError(''); callback.current(token); },
      'expired-callback': () => callback.current(''),
      'error-callback': () => { callback.current(''); setError('Visitor check failed. Refresh this page or enter requirements manually.'); },
    });
    return () => { window.turnstile?.remove(widget); };
  }, [attempt, loaded, session, sitekey]);
  if (!sitekey) return <p role="status">Public AI is not configured yet. You can enter your requirements manually.</p>;
  return <div>
    <p>Complete the visitor check to use the shared AI demo.</p>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive"
      onReady={() => setLoaded(true)} onError={() => setError('Visitor check could not load. Try again later.')} />
    <div ref={container} />
    {error && <p role="alert">{error}</p>}
  </div>;
}

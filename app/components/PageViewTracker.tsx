'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isPublicPagePath } from '@/app/lib/page-analytics-public';

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !isPublicPagePath(pathname)) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    void fetch('/api/analytics/page-view', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      }),
    });
  }, [pathname]);

  return null;
}

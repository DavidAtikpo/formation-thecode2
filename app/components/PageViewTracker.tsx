'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  ANALYTICS_CONSENT_COOKIE,
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
} from '@/app/lib/cookie-consent-public';
import { isPublicPagePath, normalizePagePath } from '@/app/lib/page-analytics-public';

function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted') return true;
  return document.cookie.includes(`${ANALYTICS_CONSENT_COOKIE}=1`);
}

function sendPageView(path: string, referrer: string | null) {
  const payload = JSON.stringify({ path, referrer });

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon('/api/analytics/page-view', blob)) return;
  }

  void fetch('/api/analytics/page-view', {
    method: 'POST',
    credentials: 'same-origin',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  const track = useCallback(() => {
    if (!pathname || !hasAnalyticsConsent()) return;
    const path = normalizePagePath(pathname);
    if (!isPublicPagePath(path)) return;
    if (lastTracked.current === path) return;
    lastTracked.current = path;

    sendPageView(
      path,
      typeof document !== 'undefined' ? document.referrer || null : null,
    );
  }, [pathname]);

  useEffect(() => {
    track();
  }, [track]);

  useEffect(() => {
    const onConsentChange = () => {
      lastTracked.current = null;
      track();
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
  }, [track]);

  return null;
}

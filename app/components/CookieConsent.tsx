'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ANALYTICS_CONSENT_COOKIE,
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  type CookieConsentValue,
} from '@/app/lib/cookie-consent-public';

const CONSENT_MAX_AGE = 365 * 24 * 60 * 60;

function persistConsent(value: CookieConsentValue) {
  localStorage.setItem(CONSENT_STORAGE_KEY, value);

  if (value === 'accepted') {
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=1; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
  } else {
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }

  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

function hasStoredConsent() {
  return localStorage.getItem(CONSENT_STORAGE_KEY);
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasStoredConsent()) {
      setVisible(true);
    }
  }, []);

  const choose = useCallback((value: CookieConsentValue) => {
    persistConsent(value);
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#0d0e22]/95 p-4 shadow-2xl backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p
            id="cookie-consent-title"
            className="text-sm font-semibold text-white sm:text-base"
          >
            Cookies et confidentialité
          </p>
          <p id="cookie-consent-desc" className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
            Nous utilisons un cookie de session pour votre connexion (nécessaire) et, avec
            votre accord, des statistiques anonymes de visite pour améliorer le site (pages
            consultées, pays/ville approximatifs). Aucun cookie publicitaire.
          </p>
          <Link
            href="/confidentialite"
            className="mt-2 inline-block text-xs text-brand-400 hover:underline"
          >
            En savoir plus
          </Link>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose('rejected')}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 sm:text-sm"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-400 sm:text-sm"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

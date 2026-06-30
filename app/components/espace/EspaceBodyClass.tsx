'use client';

import { useEffect } from 'react';

/** Classe body pour styles mobile (chatbot au-dessus de la bottom nav). */
export default function EspaceBodyClass() {
  useEffect(() => {
    document.body.classList.add('espace-route');
    return () => document.body.classList.remove('espace-route');
  }, []);
  return null;
}

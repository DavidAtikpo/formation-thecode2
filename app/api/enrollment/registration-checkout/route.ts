import { NextResponse } from 'next/server';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiError, apiForbidden } from '@/app/lib/api-security';

export const runtime = 'nodejs';

/** L'inscription est gratuite — le paiement se fait par tranches dans l'espace candidat. */
export async function POST() {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  return apiError(
    "L'inscription est gratuite. Réglez les tranches de formation depuis votre espace candidat.",
    400,
  );
}

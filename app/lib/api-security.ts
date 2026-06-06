import { NextResponse } from 'next/server';

export const GENERIC_SERVER_ERROR = 'Une erreur est survenue';

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function apiUnauthorized() {
  return apiError('Non autorisé', 401);
}

export function apiForbidden() {
  return apiError('Accès refusé', 403);
}

export function apiServerError() {
  return apiError(GENERIC_SERVER_ERROR, 500);
}

export function isPassportOwnedByUser(publicId: string, userId: string) {
  const prefix = `thecode2/passports/${userId}_`;
  return typeof publicId === 'string' && publicId.startsWith(prefix);
}

export function isAllowedPassportUrl(url: string) {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloud) return true;
  return url.includes(`res.cloudinary.com/${cloud}/`);
}

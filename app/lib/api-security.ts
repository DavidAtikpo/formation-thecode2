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

export function isAllowedHttpsUrl(url: string) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isPassportOwnedByUser(publicId: string, userId: string) {
  const prefix = `thecode2/passports/${userId}_`;
  return typeof publicId === 'string' && publicId.startsWith(prefix);
}

function isAllowedCloudinaryUrl(url: string, pathSegment: string) {
  if (!isAllowedHttpsUrl(url)) return false;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloud) {
    return process.env.NODE_ENV !== 'production';
  }
  return url.includes(`res.cloudinary.com/${cloud}/`) && url.includes(pathSegment);
}

export function isAllowedPassportUrl(url: string) {
  return isAllowedCloudinaryUrl(url, '/thecode2/passports/');
}

export function isIdentityOwnedByUser(publicId: string, userId: string) {
  const prefix = `thecode2/identity/${userId}_`;
  return typeof publicId === 'string' && publicId.startsWith(prefix);
}

export function isAllowedIdentityUrl(url: string) {
  return isAllowedCloudinaryUrl(url, '/thecode2/identity/');
}

export function isCourseAssetPublicId(publicId: string) {
  return typeof publicId === 'string' && publicId.startsWith('thecode2/courses/');
}

export function isAllowedCourseAssetUrl(url: string) {
  return isAllowedCloudinaryUrl(url, '/thecode2/courses/');
}

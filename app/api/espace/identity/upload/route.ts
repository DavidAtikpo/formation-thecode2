import { NextResponse } from 'next/server';
import { ensureCloudinary } from '@/app/lib/cloudinary';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  const cld = ensureCloudinary();
  if (!cld) {
    return apiError('Upload indisponible', 503);
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return apiError('Fichier requis', 400);
  }
  if (!ALLOWED.includes(file.type)) {
    return apiError('Format accepté : JPG, PNG ou WebP', 400);
  }
  if (file.size > MAX_BYTES) {
    return apiError('Fichier trop volumineux (max 8 Mo)', 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  try {
    const result = await cld.uploader.upload(base64, {
      folder: 'thecode2/identity',
      public_id: `${userId}_${Date.now()}`,
      overwrite: false,
      resource_type: 'image',
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch {
    return apiServerError();
  }
}

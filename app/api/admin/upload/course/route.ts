import { NextResponse } from 'next/server';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { ensureCloudinary } from '@/app/lib/cloudinary';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = ['application/pdf'];

export async function POST(request: Request) {
  if (!(await getAdminSessionUserId())) {
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
    return apiError('Format accepté : PDF uniquement', 400);
  }
  if (file.size > MAX_BYTES) {
    return apiError('Fichier trop volumineux (max 20 Mo)', 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  try {
    const result = await cld.uploader.upload(base64, {
      folder: 'thecode2/courses',
      public_id: `course_${Date.now()}`,
      overwrite: false,
      resource_type: 'raw',
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch {
    return apiServerError();
  }
}

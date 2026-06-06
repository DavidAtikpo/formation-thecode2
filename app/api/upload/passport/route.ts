import { NextResponse } from 'next/server';
import { ensureCloudinary } from '@/app/lib/cloudinary';
import { getVerifiedSessionUserId } from '@/app/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Vérifiez votre adresse email pour continuer' },
      { status: 403 },
    );
  }

  const cld = ensureCloudinary();
  if (!cld) {
    return NextResponse.json({ error: 'Upload non configuré (Cloudinary)' }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Format accepté : JPG, PNG ou WebP' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  try {
    const result = await cld.uploader.upload(base64, {
      folder: 'thecode2/passports',
      public_id: `${userId}_${Date.now()}`,
      overwrite: true,
      resource_type: 'image',
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (e: unknown) {
    console.error('[upload/passport]', e);
    return NextResponse.json({ error: 'Échec de l\'upload' }, { status: 500 });
  }
}

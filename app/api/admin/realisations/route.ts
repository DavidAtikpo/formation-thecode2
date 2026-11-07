import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { apiError, apiForbidden, apiServerError } from '@/app/lib/api-security';
import {
  addRealisationComment,
  createRealisation,
  deleteRealisation,
  getAdminRealisations,
} from '@/app/lib/realisation-reactions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'realisations');

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function removeImage(src: string) {
  const base = path.basename(src);
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(base)) return;
  await unlink(path.join(IMAGES_DIR, base)).catch(() => undefined);
}

export async function GET() {
  if (!(await getAdminSessionUserId())) return apiForbidden();
  try {
    const items = await getAdminRealisations();
    return json({ items });
  } catch {
    return apiServerError();
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSessionUserId())) return apiForbidden();

  try {
    const form = await request.formData();
    const title = typeof form.get('title') === 'string' ? String(form.get('title')) : '';
    const caption = typeof form.get('caption') === 'string' ? String(form.get('caption')) : '';
    const authorName = typeof form.get('authorName') === 'string' ? String(form.get('authorName')) : '';
    const body = typeof form.get('body') === 'string' ? String(form.get('body')) : '';
    const file = form.get('file');

    if (!(file instanceof File)) return apiError('Ajoutez une photo', 400);
    const extension = EXTENSIONS[file.type];
    if (!extension) return apiError('Photo acceptée : JPG, PNG ou WebP', 400);
    if (file.size > MAX_BYTES) return apiError('Photo trop volumineuse (max 8 Mo)', 400);

    const filename = `${randomUUID()}${extension}`;
    const src = `/images/realisations/${filename}`;
    await mkdir(IMAGES_DIR, { recursive: true });
    await writeFile(path.join(IMAGES_DIR, filename), Buffer.from(await file.arrayBuffer()), { flag: 'wx' });

    const result = await createRealisation({ title, caption, src, authorName, body });
    if ('error' in result) {
      await removeImage(src);
      return apiError(result.error, 400);
    }
    return json({ item: result.item }, 201);
  } catch {
    return apiServerError();
  }
}

export async function PATCH(request: Request) {
  if (!(await getAdminSessionUserId())) return apiForbidden();

  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const authorName = typeof body.authorName === 'string' ? body.authorName : '';
    const message = typeof body.body === 'string' ? body.body : '';
    const result = await addRealisationComment(id, authorName, message);
    if ('error' in result) {
      const status = result.error === 'Réalisation inconnue' ? 404 : 400;
      return apiError(result.error, status);
    }
    return json(result, 201);
  } catch {
    return apiServerError();
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdminSessionUserId())) return apiForbidden();

  try {
    const id = new URL(request.url).searchParams.get('id') ?? '';
    const removed = await deleteRealisation(id);
    if (!removed) return apiError('Réalisation inconnue', 404);
    await removeImage(removed.src);
    return json({ ok: true });
  } catch {
    return apiServerError();
  }
}

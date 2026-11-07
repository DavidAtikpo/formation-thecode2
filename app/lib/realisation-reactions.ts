import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { REALISATIONS } from '@/app/lib/realisations';

const VISITOR_COOKIE = 'thecode2_visitor';
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const STORE_PATH = path.join(process.cwd(), 'data', 'realisation-reactions.json');

type StoredLike = { realisationId: string; visitorId: string };
type StoredComment = {
  id: string;
  realisationId: string;
  authorName: string;
  body: string;
  createdAt: string;
};
export type StoredRealisation = {
  id: string;
  title: string;
  caption: string;
  src: string;
  createdAt: string;
};
type Store = { items?: StoredRealisation[]; likes: StoredLike[]; comments: StoredComment[] };

export type PublicComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type RealisationCard = {
  id: string;
  title: string;
  caption: string;
  src: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  comments: PublicComment[];
};

function emptyStore(): Store {
  return { likes: [], comments: [] };
}
let queue: Promise<unknown> = Promise.resolve();

function withStore<T>(task: (store: Store) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    await mkdir(path.dirname(STORE_PATH), { recursive: true });
    let store = emptyStore();
    try {
      store = JSON.parse(await readFile(STORE_PATH, 'utf8')) as Store;
      if (!Array.isArray(store.likes) || !Array.isArray(store.comments)) store = emptyStore();
    } catch {
      store = emptyStore();
    }
    ensureItems(store);
    const result = await task(store);
    await writeFile(STORE_PATH, JSON.stringify(store));
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function getVisitorId() {
  const jar = await cookies();
  const current = jar.get(VISITOR_COOKIE)?.value;
  if (current && /^[0-9a-f-]{36}$/i.test(current)) return current;

  const visitorId = randomUUID();
  jar.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: VISITOR_MAX_AGE,
  });
  return visitorId;
}

function seedItems(): StoredRealisation[] {
  return REALISATIONS.map((item) => ({
    id: item.id,
    title: item.title,
    caption: item.caption,
    src: item.src,
    createdAt: '2026-11-07T00:00:00.000Z',
  }));
}

function ensureItems(store: Store) {
  if (!Array.isArray(store.items)) store.items = seedItems();
}

function commentsFor(store: Store, realisationId: string): PublicComment[] {
  return store.comments
    .filter((comment) => comment.realisationId === realisationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ id, authorName, body, createdAt }) => ({ id, authorName, body, createdAt }));
}

function toCard(store: Store, item: StoredRealisation, visitorId: string): RealisationCard {
  return {
    ...item,
    likes: store.likes.filter((like) => like.realisationId === item.id).length,
    liked: store.likes.some((like) => like.realisationId === item.id && like.visitorId === visitorId),
    comments: commentsFor(store, item.id),
  };
}

function knownId(store: Store, realisationId: string) {
  return store.items!.some((item) => item.id === realisationId);
}

export function slugifyRealisationTitle(title: string) {
  const base = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'realisation';
}

export async function getRealisationCards(visitorId: string): Promise<RealisationCard[]> {
  return withStore((store) => store.items!.map((item) => toCard(store, item, visitorId)));
}

export async function getAdminRealisations(): Promise<RealisationCard[]> {
  return getRealisationCards('');
}

export async function toggleRealisationLike(realisationId: string, visitorId: string) {
  return withStore((store) => {
    if (!knownId(store, realisationId)) return null;
    const index = store.likes.findIndex(
      (like) => like.realisationId === realisationId && like.visitorId === visitorId,
    );
    const liked = index === -1;
    if (liked) store.likes.push({ realisationId, visitorId });
    else store.likes.splice(index, 1);
    return {
      likes: store.likes.filter((like) => like.realisationId === realisationId).length,
      liked,
    };
  });
}

export function validateComment(
  authorName: string,
  body: string,
): { error: string } | { name: string; text: string } {
  const name = authorName.trim().slice(0, 40);
  const text = body.trim();
  if (name.length < 2) return { error: 'Indiquez votre prénom' };
  if (text.length < 2) return { error: 'Écrivez un commentaire' };
  if (text.length > 400) return { error: 'Commentaire trop long' };
  return { name, text };
}

export async function addRealisationComment(
  realisationId: string,
  authorName: string,
  body: string,
): Promise<{ error: string } | { comment: PublicComment; comments: number }> {
  const parsed = validateComment(authorName, body);
  if ('error' in parsed) return { error: parsed.error };

  return withStore((store) => {
    if (!knownId(store, realisationId)) return { error: 'Réalisation inconnue' as const };
    const comment = {
      id: randomUUID(),
      realisationId,
      authorName: parsed.name,
      body: parsed.text,
      createdAt: new Date().toISOString(),
    };
    store.comments.push(comment);
    return {
      comment: {
        id: comment.id,
        authorName: comment.authorName,
        body: comment.body,
        createdAt: comment.createdAt,
      },
      comments: store.comments.filter((entry) => entry.realisationId === realisationId).length,
    };
  });
}

export async function createRealisation(input: {
  title: string;
  caption: string;
  src: string;
  authorName?: string;
  body?: string;
}): Promise<{ error: string } | { item: RealisationCard }> {
  const title = input.title.trim().slice(0, 80);
  const caption = input.caption.trim().slice(0, 280);
  if (title.length < 2) return { error: 'Indiquez un titre' };
  if (caption.length < 2) return { error: 'Indiquez une légende' };
  if (!input.src.startsWith('/images/realisations/')) return { error: 'Photo invalide' };

  const wantsComment = Boolean(input.authorName?.trim() || input.body?.trim());
  const parsedComment = wantsComment ? validateComment(input.authorName ?? '', input.body ?? '') : null;
  if (parsedComment && 'error' in parsedComment) return { error: parsedComment.error };

  return withStore((store) => {
    const taken = new Set(store.items!.map((item) => item.id));
    let id = slugifyRealisationTitle(title);
    let n = 2;
    while (taken.has(id)) id = `${slugifyRealisationTitle(title)}-${n++}`;

    const item: StoredRealisation = {
      id,
      title,
      caption,
      src: input.src,
      createdAt: new Date().toISOString(),
    };
    store.items!.push(item);

    if (parsedComment && !('error' in parsedComment)) {
      store.comments.push({
        id: randomUUID(),
        realisationId: id,
        authorName: parsedComment.name,
        body: parsedComment.text,
        createdAt: item.createdAt,
      });
    }

    return { item: toCard(store, item, '') };
  });
}

export async function deleteRealisation(realisationId: string) {
  return withStore((store) => {
    const index = store.items!.findIndex((item) => item.id === realisationId);
    if (index < 0) return null;
    const [removed] = store.items!.splice(index, 1);
    store.likes = store.likes.filter((like) => like.realisationId !== realisationId);
    store.comments = store.comments.filter((comment) => comment.realisationId !== realisationId);
    return removed;
  });
}

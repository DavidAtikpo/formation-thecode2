import { createRequire } from 'node:module';
import path from 'node:path';
import { createWorker } from 'tesseract.js';

function getTesseractOptions() {
  const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'));
  const packageRoot = path.dirname(nodeRequire.resolve('tesseract.js/package.json'));
  const workerPath = path.join(packageRoot, 'src', 'worker-script', 'node', 'index.js');

  return {
    workerPath,
    cachePath: path.join(process.cwd(), '.tesseract-cache'),
  };
}

export type IdentityDocumentType = 'id_card' | 'passport';

export function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

export function namesMatch(ocrText: string, firstName: string, lastName: string) {
  const text = normalizeName(ocrText);
  const last = normalizeName(lastName);
  const first = normalizeName(firstName);

  if (!last || !text.includes(last)) return false;
  if (!first) return true;
  if (text.includes(first)) return true;
  if (first.length >= 3 && text.includes(first.slice(0, 3))) return true;

  return false;
}

export function parseYYMMDD(yymmdd: string): Date | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;

  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  const year = yy >= 50 ? 1900 + yy : 2000 + yy;
  const date = new Date(year, mm - 1, dd);

  if (date.getFullYear() !== year || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return null;
  }

  return date;
}

export function findMrzLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/\s/g, '').toUpperCase())
    .filter((line) => line.length >= 30 && /^[A-Z0-9<]+$/.test(line));
}

export function parseMrzExpiry(mrzLine2: string): Date | null {
  const line = mrzLine2.replace(/\s/g, '').toUpperCase();
  if (line.length < 27) return null;
  return parseYYMMDD(line.slice(21, 27));
}

export function extractDatesFromText(text: string): Date[] {
  const dates: Date[] = [];
  const now = new Date();

  const fourDigit = /\b(\d{2})[/.-](\d{2})[/.-](\d{4})\b/g;
  let match = fourDigit.exec(text);
  while (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date > now
    ) {
      dates.push(date);
    }
    match = fourDigit.exec(text);
  }

  const twoDigit = /\b(\d{2})[/.-](\d{2})[/.-](\d{2})\b/g;
  match = twoDigit.exec(text);
  while (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const yy = Number(match[3]);
    const year = yy >= 50 ? 1900 + yy : 2000 + yy;
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date > now
    ) {
      dates.push(date);
    }
    match = twoDigit.exec(text);
  }

  return dates;
}

export function pickExpiryDate(
  text: string,
  documentType: IdentityDocumentType,
): Date | null {
  const mrzLines = findMrzLines(text);

  if (documentType === 'passport' && mrzLines.length > 0) {
    const line2 = mrzLines.find((line) => line.length >= 44) ?? mrzLines[mrzLines.length - 1];
    const mrzExpiry = parseMrzExpiry(line2);
    if (mrzExpiry) return mrzExpiry;
  }

  const futureDates = extractDatesFromText(text);
  if (futureDates.length === 0) return null;

  futureDates.sort((a, b) => b.getTime() - a.getTime());
  return futureDates[0];
}

export async function extractTextFromImageUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let buffer: Buffer;
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error('Impossible de lire le document');
    }
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > 8 * 1024 * 1024) {
      throw new Error('Document trop volumineux');
    }
    buffer = Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }

  const worker = await getSharedWorker();

  const { data } = await worker.recognize(buffer);
  return data.text;
}

let sharedWorkerPromise: ReturnType<typeof createWorker> | null = null;

async function getSharedWorker() {
  if (!sharedWorkerPromise) {
    sharedWorkerPromise = createWorker('fra+eng', 1, getTesseractOptions());
  }
  return sharedWorkerPromise;
}

export function verifyIdentityDocument(params: {
  ocrText: string;
  firstName: string;
  lastName: string;
  documentType: IdentityDocumentType;
}):
  | { ok: true; expiryDate: Date; extractedName: string }
  | { ok: false; error: string } {
  const expiryDate = pickExpiryDate(params.ocrText, params.documentType);

  if (!expiryDate) {
    return {
      ok: false,
      error:
        'Date d\'expiration introuvable. Assurez-vous que le document est lisible, bien éclairé et que la date est visible.',
    };
  }

  if (expiryDate <= new Date()) {
    return { ok: false, error: 'Ce document est expiré. Veuillez fournir une pièce en cours de validité.' };
  }

  if (!namesMatch(params.ocrText, params.firstName, params.lastName)) {
    return {
      ok: false,
      error:
        'Le nom sur le document ne correspond pas à celui de votre inscription. Vérifiez l\'orthographe ou la qualité de la photo.',
    };
  }

  return {
    ok: true,
    expiryDate,
    extractedName: `${params.firstName.trim()} ${params.lastName.trim()}`,
  };
}

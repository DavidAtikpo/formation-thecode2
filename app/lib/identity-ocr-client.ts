'use client';

/** OCR local (navigateur) — évite le timeout serveur sur l'analyse Tesseract. */
export async function extractTextFromIdentityFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('fra+eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(message.progress * 100));
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    const text = data.text?.trim() ?? '';
    if (text.length < 10) {
      throw new Error('Texte illisible sur le document. Utilisez une photo plus nette.');
    }
    return text;
  } finally {
    await worker.terminate();
  }
}

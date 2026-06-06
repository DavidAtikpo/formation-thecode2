'use client';

import { useState } from 'react';
import ReloadSpinner from '@/app/components/ReloadSpinner';
import type { IdentityDocumentType } from '@/app/lib/identity-verification';

type IdentityState = {
  documentType: IdentityDocumentType | null;
  status: 'pending' | 'verified' | 'failed' | 'expired';
  verifiedAt: string | null;
  expiryDate: string | null;
  extractedName: string | null;
  error: string | null;
};

type Props = {
  firstName: string;
  lastName: string;
  identity: IdentityState;
  onVerified: () => void;
};

const DOC_LABELS: Record<IdentityDocumentType, string> = {
  id_card: "Carte d'identité",
  passport: 'Passeport',
};

const STATUS_LABELS: Record<IdentityState['status'], string> = {
  pending: 'En attente',
  verified: 'Vérifiée',
  failed: 'Échec',
  expired: 'Expirée',
};

export default function IdentityVerificationPanel({
  firstName,
  lastName,
  identity,
  onVerified,
}: Props) {
  const [documentType, setDocumentType] = useState<IdentityDocumentType>('id_card');
  const [preview, setPreview] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [filePublicId, setFilePublicId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = identity.status !== 'verified' && fileUrl && filePublicId;

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/espace/identity/upload', {
        method: 'POST',
        credentials: 'include',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload impossible');
      setFileUrl(data.url);
      setFilePublicId(data.publicId);
      setPreview(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/espace/identity/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, fileUrl, filePublicId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Vérification échouée');
      onVerified();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400 sm:text-sm">
        <p>
          Téléversez votre <strong className="text-slate-200">carte d&apos;identité</strong> ou votre{' '}
          <strong className="text-slate-200">passeport</strong>. Le système vérifie automatiquement que le
          nom correspond à <strong className="text-slate-200">{firstName} {lastName}</strong> et que le
          document n&apos;est pas expiré.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
        <span className="text-xs text-slate-400">Statut</span>
        <StatusPill status={identity.status} />
      </div>

      {identity.status === 'verified' && identity.expiryDate && (
        <div className="rounded-lg border border-green-400/30 bg-green-400/10 px-3 py-2 text-xs text-green-200 sm:text-sm">
          Identité vérifiée
          {identity.extractedName && <> — {identity.extractedName}</>}
          <br />
          Expire le{' '}
          {new Date(identity.expiryDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      )}

      {(identity.status === 'failed' || identity.status === 'expired') && identity.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 sm:text-sm">
          {identity.error}
        </div>
      )}

      {identity.status !== 'verified' && (
        <>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-300">Type de document</p>
            <div className="grid grid-cols-2 gap-2">
              {(['id_card', 'passport'] as IdentityDocumentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDocumentType(type)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition sm:text-sm ${
                    documentType === type
                      ? 'border-brand-400 bg-brand-400/10 text-white'
                      : 'border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {DOC_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-300">Photo du document *</p>
            <p className="mb-2 text-[11px] text-slate-500">
              Photo nette, sans reflet. La zone du nom et la date d&apos;expiration doivent être lisibles.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Aperçu document"
                  className="h-24 w-36 rounded-lg object-cover ring-2 ring-brand-400/40"
                />
              )}
              <label className="cursor-pointer rounded-lg border border-dashed border-brand-400/40 px-4 py-3 text-sm text-brand-300 hover:bg-brand-400/10">
                {preview ? 'Changer le document' : 'Téléverser'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                  }}
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={busy || !canSubmit}
            onClick={verify}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
          >
            {busy && <ReloadSpinner size="sm" label="Vérification en cours" />}
            {busy ? 'Vérification en cours…' : 'Vérifier mon identité'}
          </button>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: IdentityState['status'] }) {
  const styles = {
    pending: 'bg-amber-400/15 text-amber-300',
    verified: 'bg-green-400/15 text-green-300',
    failed: 'bg-red-400/15 text-red-300',
    expired: 'bg-red-400/15 text-red-300',
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

import { NextResponse } from 'next/server';
import {
  apiError,
  apiForbidden,
  apiServerError,
  isAllowedIdentityUrl,
  isIdentityOwnedByUser,
} from '@/app/lib/api-security';
import { getVerifiedSessionUserId } from '@/app/lib/auth';
import {
  extractTextFromImageUrl,
  verifyIdentityDocument,
  type IdentityDocumentType,
} from '@/app/lib/identity-verification';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    return apiForbidden();
  }

  try {
    const body = await request.json();
    const documentType = body.documentType as IdentityDocumentType;
    const fileUrl = typeof body.fileUrl === 'string' ? body.fileUrl.trim() : '';
    const filePublicId = typeof body.filePublicId === 'string' ? body.filePublicId.trim() : '';

    if (documentType !== 'id_card' && documentType !== 'passport') {
      return apiError('Type de document invalide', 400);
    }
    if (!fileUrl || !filePublicId) {
      return apiError('Document requis', 400);
    }
    if (!isIdentityOwnedByUser(filePublicId, userId)) {
      return apiError('Document invalide', 400);
    }
    if (!isAllowedIdentityUrl(fileUrl)) {
      return apiError('URL de document invalide', 400);
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, status: { in: ['active', 'paid'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment) {
      return apiError('Aucune inscription active', 404);
    }

    let ocrText: string;
    try {
      ocrText = await extractTextFromImageUrl(fileUrl);
    } catch {
      return apiError(
        'Analyse du document impossible. Réessayez avec une photo plus nette.',
        422,
      );
    }
    const result = verifyIdentityDocument({
      ocrText,
      firstName: enrollment.firstName,
      lastName: enrollment.lastName,
      documentType,
    });

    if (!result.ok) {
      const updated = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          identityDocumentType: documentType,
          identityDocumentUrl: fileUrl,
          identityDocumentPublicId: filePublicId,
          identityVerificationStatus: 'failed',
          identityVerifiedAt: null,
          identityExpiryDate: null,
          identityExtractedName: null,
          identityVerificationError: result.error,
        },
      });

      return NextResponse.json({
        ok: false,
        error: result.error,
        identity: serializeIdentity(updated),
      });
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        identityDocumentType: documentType,
        identityDocumentUrl: fileUrl,
        identityDocumentPublicId: filePublicId,
        identityVerificationStatus: 'verified',
        identityVerifiedAt: new Date(),
        identityExpiryDate: result.expiryDate,
        identityExtractedName: result.extractedName,
        identityVerificationError: null,
      },
    });

    return NextResponse.json({
      ok: true,
      identity: serializeIdentity(updated),
    });
  } catch {
    return apiServerError();
  }
}

function serializeIdentity(enrollment: {
  identityDocumentType: string | null;
  identityDocumentUrl: string | null;
  identityVerificationStatus: string;
  identityVerifiedAt: Date | null;
  identityExpiryDate: Date | null;
  identityExtractedName: string | null;
  identityVerificationError: string | null;
}) {
  return {
    documentType: enrollment.identityDocumentType,
    documentUrl: enrollment.identityDocumentUrl,
    status: enrollment.identityVerificationStatus,
    verifiedAt: enrollment.identityVerifiedAt?.toISOString() ?? null,
    expiryDate: enrollment.identityExpiryDate?.toISOString() ?? null,
    extractedName: enrollment.identityExtractedName,
    error: enrollment.identityVerificationError,
  };
}

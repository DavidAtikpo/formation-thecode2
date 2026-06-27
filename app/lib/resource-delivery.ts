import { sendLearningResourceEmail } from '@/app/lib/email';
import { getAppBaseUrl } from '@/app/lib/email-verification';
import { findMatchingEnrollments, labelResourceType } from '@/app/lib/learning-resources';
import { prisma } from '@/app/lib/prisma';

export async function deliverResourceToCandidates(
  resourceId: string,
  request?: Request,
): Promise<{
  matched: number;
  newDeliveries: number;
  emailsSent: number;
  alreadyDelivered: number;
} | null> {
  const resource = await prisma.learningResource.findUnique({
    where: { id: resourceId },
    include: { _count: { select: { deliveries: true } } },
  });

  if (!resource) return null;

  const enrollments = await findMatchingEnrollments({
    domain: resource.domain,
    formationSession: resource.formationSession,
    duration: resource.duration,
  });

  if (enrollments.length === 0) {
    return { matched: 0, newDeliveries: 0, emailsSent: 0, alreadyDelivered: 0 };
  }

  const existingDeliveries = await prisma.resourceDelivery.findMany({
    where: { resourceId },
    select: { enrollmentId: true },
  });
  const alreadyDelivered = new Set(existingDeliveries.map((d) => d.enrollmentId));

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || getAppBaseUrl(request);
  const espaceUrl = `${base.replace(/\/$/, '')}/espace/cours`;
  const typeLabel = labelResourceType(resource.type);

  let newDeliveries = 0;
  let emailsSent = 0;

  for (const enrollment of enrollments) {
    if (alreadyDelivered.has(enrollment.id)) continue;

    const delivery = await prisma.resourceDelivery.create({
      data: { resourceId, enrollmentId: enrollment.id },
    });
    newDeliveries += 1;

    const sent = await sendLearningResourceEmail({
      to: enrollment.user.email,
      title: resource.title,
      typeLabel,
      espaceUrl,
    });

    if (sent) {
      emailsSent += 1;
      await prisma.resourceDelivery.update({
        where: { id: delivery.id },
        data: { emailSentAt: new Date() },
      });
    }
  }

  if (newDeliveries > 0 || !resource.published) {
    await prisma.learningResource.update({
      where: { id: resourceId },
      data: {
        published: true,
        publishedAt: resource.publishedAt ?? new Date(),
      },
    });
  }

  return {
    matched: enrollments.length,
    newDeliveries,
    emailsSent,
    alreadyDelivered: alreadyDelivered.size,
  };
}

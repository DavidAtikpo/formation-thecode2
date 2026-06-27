import {
  categoryLabel,
  availabilityLabel,
  publicationStatusLabel,
  contractTypeLabel,
  serializePublicJobListing,
  serializePublicTalentProfile,
} from '@/app/lib/ecosystem-public';
import type { JobContractType, PublicationStatus, TalentCategory } from '@prisma/client';

export function serializeAdminTalentProfile(profile: {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  category: TalentCategory;
  headline: string | null;
  bio: string | null;
  country: string | null;
  yearsExperience: number | null;
  skills: string[];
  portfolioUrl: string | null;
  availability: string[];
  status: PublicationStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...serializePublicTalentProfile(profile),
    firstName: profile.firstName,
    lastName: profile.lastName,
    userId: profile.userId,
    status: profile.status,
    statusLabel: publicationStatusLabel(profile.status),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function serializeAdminJobListing(listing: {
  id: string;
  title: string;
  company: string;
  description: string;
  category: TalentCategory;
  location: string | null;
  remote: boolean;
  contractType: JobContractType;
  status: PublicationStatus;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...serializePublicJobListing(listing),
    status: listing.status,
    statusLabel: publicationStatusLabel(listing.status),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

export { categoryLabel, availabilityLabel, contractTypeLabel, publicationStatusLabel };

import { redirect } from 'next/navigation';
import { getAdminSessionUserId } from '@/app/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminId = await getAdminSessionUserId();
  if (!adminId) {
    redirect('/connexion?redirect=/admin');
  }

  return <>{children}</>;
}

import { NextResponse } from 'next/server';
import { getAdminSessionUserId } from '@/app/lib/admin';
import { getAdminDashboardStats } from '@/app/lib/admin-stats';
import { apiForbidden, apiServerError } from '@/app/lib/api-security';

export async function GET() {
  if (!(await getAdminSessionUserId())) {
    return apiForbidden();
  }

  try {
    const stats = await getAdminDashboardStats();
    return NextResponse.json(stats);
  } catch {
    return apiServerError();
  }
}

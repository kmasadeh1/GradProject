import { getServerProfile } from '@/lib/getServerProfile';
import DashboardShell from '@/app/components/DashboardShell';
import AdminPanel from '@/app/dashboard/components/AdminPanel';

export const metadata = {
  title: 'Admin Panel - FortiGRC',
  description: 'Admin panel for managing user roles and waiver requests.',
};

export default async function AdminPage() {
  const { user, profile } = await getServerProfile();
  return (
    <DashboardShell title="Admin Panel" userEmail={user?.email ?? ''} profile={profile}>
      <AdminPanel userRole={profile.role} currentUserId={user?.id} />
    </DashboardShell>
  );
}

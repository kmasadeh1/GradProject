import { getServerProfile } from '@/lib/getServerProfile';
import DashboardShell from '@/app/components/DashboardShell';
import Settings from '@/app/dashboard/components/Settings';

export const metadata = {
  title: 'Settings - FortiGRC',
  description: 'Application settings and preferences.',
};

export default async function SettingsPage() {
  const { user, profile } = await getServerProfile();
  return (
    <DashboardShell title="Settings" userEmail={user?.email ?? ''} profile={profile}>
      <Settings userRole={profile.role} currentAvatar={profile.avatar_url} />
    </DashboardShell>
  );
}

import { getServerProfile } from '@/lib/getServerProfile';
import DashboardShell from '@/app/components/DashboardShell';
import Incidents from '@/app/dashboard/components/Incidents';

export const metadata = {
  title: 'Incident Response - FortiGRC',
  description: 'Manage and track security incidents.',
};

export default async function IncidentsPage() {
  const { user, profile } = await getServerProfile();
  return (
    <DashboardShell title="Incident Response" userEmail={user?.email ?? ''} profile={profile}>
      <Incidents userRole={profile.role} />
    </DashboardShell>
  );
}

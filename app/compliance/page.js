import { getServerProfile } from '@/lib/getServerProfile';
import DashboardShell from '@/app/components/DashboardShell';
import ComplianceManagement from '@/app/dashboard/components/ComplianceManagement';

export const metadata = {
  title: 'Compliance Controls - FortiGRC',
  description: 'Map and monitor S.E.L.E.C.T compliance controls.',
};

export default async function CompliancePage() {
  const { user, profile } = await getServerProfile();
  return (
    <DashboardShell title="Compliance Controls" userEmail={user?.email ?? ''} profile={profile}>
      <ComplianceManagement userRole={profile.role} />
    </DashboardShell>
  );
}

import { getServerProfile } from '@/lib/getServerProfile';
import DashboardShell from '@/app/components/DashboardShell';
import Assessments from '@/app/dashboard/components/Assessments';

export const metadata = {
  title: 'Security Assessments - FortiGRC',
  description: 'Security assessment questionnaires and scoring.',
};

export default async function AssessmentsPage() {
  const { user, profile } = await getServerProfile();
  return (
    <DashboardShell title="Security Assessments" userEmail={user?.email ?? ''} profile={profile}>
      <Assessments userRole={profile.role} />
    </DashboardShell>
  );
}

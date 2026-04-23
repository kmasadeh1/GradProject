export const dynamic = 'force-dynamic';

import DashboardClient from '@/app/dashboard/DashboardClient';

export const metadata = {
  title: 'Assessments - FortiGRC',
  description: 'FortiGRC Internal Security Assessments and Audits',
};

export default function AssessmentsPage() {
  return <DashboardClient view="assessments" />;
}

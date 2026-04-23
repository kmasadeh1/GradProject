export const dynamic = 'force-dynamic';

import DashboardClient from '@/app/dashboard/DashboardClient';

export const metadata = {
  title: 'Compliance Controls - FortiGRC',
  description: 'Map and monitor S.E.L.E.C.T compliance controls.',
};

export default function CompliancePage() {
  return <DashboardClient view="compliance" />;
}

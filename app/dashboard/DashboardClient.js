'use client';

import DashboardOverview from './components/DashboardOverview';
import RiskRegistry from './components/RiskRegistry';
import ComplianceManagement from './components/ComplianceManagement';
import RiskReports from './components/RiskReports';
import Assessments from './components/Assessments';
import Settings from './components/Settings';
import Incidents from './components/Incidents';
import AdminPanel from './components/AdminPanel';

export default function DashboardClient({ view = 'dashboard', userRole = 'user', onAvatarUpdate, currentAvatar }) {
  return (
    <>
      <div style={{ display: view === 'dashboard' ? 'block' : 'none' }}>
        <DashboardOverview userRole={userRole} />
      </div>
      <div style={{ display: view === 'risks' ? 'block' : 'none' }}>
        <RiskRegistry userRole={userRole} />
      </div>
      <div style={{ display: view === 'incidents' ? 'block' : 'none' }}>
        <Incidents userRole={userRole} />
      </div>
      <div style={{ display: view === 'reports' ? 'block' : 'none' }}>
        <RiskReports userRole={userRole} />
      </div>
      <div style={{ display: view === 'compliance' ? 'block' : 'none' }}>
        <ComplianceManagement userRole={userRole} />
      </div>
      <div style={{ display: view === 'assessments' ? 'block' : 'none' }}>
        <Assessments userRole={userRole} />
      </div>
      <div style={{ display: view === 'settings' ? 'block' : 'none' }}>
        <Settings onAvatarUpdate={onAvatarUpdate} currentAvatar={currentAvatar} userRole={userRole} />
      </div>
      <div style={{ display: view === 'admin' ? 'block' : 'none' }}>
        <AdminPanel userRole={userRole} />
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';

import AdminClient from './AdminClient';

export const metadata = {
  title: 'User Management - FortiGRC',
  description: 'Admin panel for managing user roles.',
};

export default function AdminPage() {
  return <AdminClient />;
}

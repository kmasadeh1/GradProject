export const dynamic = 'force-dynamic';

import MfaEnrollClient from './MfaEnrollClient';

export const metadata = {
  title: 'MFA Setup - FortiGRC',
  description: 'Set up two-factor authentication for your FortiGRC account.',
};

export default function MfaEnrollPage() {
  return <MfaEnrollClient />;
}

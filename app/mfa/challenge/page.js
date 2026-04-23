export const dynamic = 'force-dynamic';

import MfaChallengeClient from './MfaChallengeClient';

export const metadata = {
  title: 'Verify Identity - FortiGRC',
  description: 'Complete two-factor authentication to access your FortiGRC account.',
};

export default function MfaChallengePage() {
  return <MfaChallengeClient />;
}

export const dynamic = 'force-dynamic';

import LoginClient from './LoginClient';

export const metadata = {
  title: 'Login - FortiGRC',
  description: 'Sign in to your FortiGRC account for enterprise risk management.',
};

export default function LoginPage() {
  return <LoginClient />;
}

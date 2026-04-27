'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { sanitizeInput } from '@/lib/sanitize';
import PasswordStrengthMeter from './PasswordStrengthMeter';

export default function LoginClient() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = sanitizeInput(email);

    if (mode === 'signup') {
      // ── SIGN UP ──
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        setError('Unable to create account. Please try again.');
        setLoading(false);
        return;
      }

      // NOTE: MFA enrollment is skipped here because mfa.enroll() requires an
      // active session, which may not exist until the user confirms their email.
      // Once signed up (and confirmed), the sign-in flow handles MFA.
      // MFA enrollment redirect commented out for demo:
      // router.push('/mfa/enroll');
      router.push('/dashboard');
    } else {
      // ── SIGN IN ──
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        // Generic message — never reveal whether the email exists (prevents enumeration)
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      // Check MFA assurance level
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
        // MFA enrolled → needs challenge verification
        router.push('/mfa/challenge');
      } else if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal1') {
        // No MFA enrolled → redirect to enrollment
        router.push('/mfa/enroll');
      } else {
        router.push('/dashboard');
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex h-screen w-full">
      {/* ═══════════ LEFT PANEL — BRANDING ═══════════ */}
      <div className="hidden md:flex w-1/2 login-gradient flex-col justify-center px-12 text-white relative overflow-hidden">
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <i className="fa-solid fa-shield-halved text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold">FortiGRC</h1>
                <p className="text-sm text-blue-200/80">Enterprise Risk Management</p>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-4xl font-bold mb-3 leading-tight">
            Manage risks with
            <br />
            confidence and clarity
          </h2>
          <p className="text-blue-200/70 text-lg mb-10 max-w-md">
            Quantitative risk analysis aligned with Zero Trust security principles.
          </p>

          {/* Feature pills */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-chart-line text-emerald-400 text-sm"></i>
              </div>
              <span className="text-sm">Real-time quantitative risk monitoring</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
              <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-clipboard-check text-blue-400 text-sm"></i>
              </div>
              <span className="text-sm">S.E.L.E.C.T compliance control mapping</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
              <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-fingerprint text-violet-400 text-sm"></i>
              </div>
              <span className="text-sm">Zero Trust MFA authentication</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ RIGHT PANEL — FORM ═══════════ */}
      <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 text-white mb-3 shadow-lg shadow-blue-600/30">
              <i className="fa-solid fa-shield-halved text-2xl"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-900">FortiGRC</h1>
          </div>

          <div className="glass-card rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'signin' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {mode === 'signin'
                  ? 'Sign in to your account'
                  : 'Get started with FortiGRC today'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                id="toggle-signin"
                onClick={() => { setMode('signin'); setError(''); }}
                className={`w-1/2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === 'signin'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="toggle-signup"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`w-1/2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-center space-x-2 animate-fade-in-up">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-sm flex-shrink-0"></i>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} id="login-form">
              {/* Email */}
              <div className="mb-4">
                <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <i className="fa-regular fa-envelope absolute left-4 top-3.5 text-gray-400 text-sm"></i>
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-2">
                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-3.5 text-gray-400 text-sm"></i>
                  <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password Strength Meter — only visible in signup mode */}
              {mode === 'signup' && <PasswordStrengthMeter password={password} />}

              {/* Forgot Password — only in signin mode */}
              {mode === 'signin' && (
                <div className="text-right mb-6">
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-800 font-medium transition">
                    Forgot password?
                  </button>
                </div>
              )}

              {mode === 'signup' && <div className="mb-6" />}

              {/* Submit */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                  </>
                )}
              </button>
            </form>

            {/* Security badge */}
            <div className="flex items-center justify-center mt-6 space-x-2">
              <i className="fa-solid fa-shield-halved text-emerald-500 text-xs"></i>
              <span className="text-xs text-gray-400">Protected by Zero Trust security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

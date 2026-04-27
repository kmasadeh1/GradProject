'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';


export default function MfaEnrollClient() {
  const [factorId, setFactorId] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('loading'); // 'loading' | 'scan' | 'verify' | 'success'
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    startEnrollment();
  }, []);

  const startEnrollment = async () => {
    // Guard: ensure a valid session exists before calling mfa.enroll()
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session) {
      // No active session — redirect to login so the user authenticates first
      router.push('/login');
      return;
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'FortiGRC Authenticator',
    });

    if (enrollError) {
      setError('Failed to initialize MFA setup. Please try again.');
      setStep('scan');
      return;
    }

    setFactorId(data.id);
    setQrUri(data.totp.uri);
    setSecret(data.totp.secret);
    setStep('scan');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      setStep('success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setError('Invalid verification code. Please try again.');
    }

    setLoading(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
            <i className="fa-solid fa-shield-halved text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Two-Factor Authentication</h1>
          <p className="text-gray-500 text-sm mt-2">
            Secure your account with an authenticator app
          </p>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex items-center justify-center mb-8 space-x-2">
          {/* Step 1 */}
          <div className={`flex items-center space-x-2 ${
            step === 'scan' ? 'text-blue-600' :
            (step === 'verify' || step === 'success') ? 'text-emerald-600' : 'text-gray-400'
          }`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'scan' ? 'bg-blue-100 text-blue-600' :
              (step === 'verify' || step === 'success') ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100'
            }`}>
              {(step === 'verify' || step === 'success')
                ? <i className="fa-solid fa-check text-xs"></i>
                : '1'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Scan QR</span>
          </div>

          <div className="w-8 h-0.5 bg-gray-200 rounded" />

          {/* Step 2 */}
          <div className={`flex items-center space-x-2 ${
            step === 'verify' ? 'text-blue-600' :
            step === 'success' ? 'text-emerald-600' : 'text-gray-400'
          }`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'verify' ? 'bg-blue-100 text-blue-600' :
              step === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100'
            }`}>
              {step === 'success'
                ? <i className="fa-solid fa-check text-xs"></i>
                : '2'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Verify</span>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="glass-card rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-8">
          {/* Loading State */}
          {step === 'loading' && (
            <div className="text-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
              <p className="text-gray-500">Generating your security key…</p>
            </div>
          )}

          {/* Step 1: Scan QR */}
          {step === 'scan' && (
            <>
              <div className="text-center mb-6">
                <h3 className="font-semibold text-gray-900 mb-1">Scan this QR code</h3>
                <p className="text-sm text-gray-500">
                  Use Google Authenticator, Authy, or any TOTP app
                </p>
              </div>

              {/* QR Code */}
              {qrUri && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <QRCodeSVG value={qrUri} size={200} level="M" includeMargin />
                  </div>
                </div>
              )}

              {/* Manual Secret Fallback */}
              <div className="mb-6">
                <p className="text-xs text-gray-500 text-center mb-2">
                  Or enter this secret manually:
                </p>
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <code className="flex-1 text-sm font-mono text-gray-700 break-all select-all">
                    {secret}
                  </code>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
                    title="Copy secret"
                  >
                    <i className={`fa-regular ${copied ? 'fa-circle-check text-emerald-500' : 'fa-copy'}`}></i>
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-center space-x-2">
                  <i className="fa-solid fa-circle-exclamation text-red-500 text-sm"></i>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                onClick={() => setStep('verify')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                I&apos;ve scanned the code
                <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
              </button>
            </>
          )}

          {/* Step 2: Verify Code */}
          {step === 'verify' && (
            <>
              <div className="text-center mb-6">
                <h3 className="font-semibold text-gray-900 mb-1">Enter verification code</h3>
                <p className="text-sm text-gray-500">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-center space-x-2">
                  <i className="fa-solid fa-circle-exclamation text-red-500 text-sm"></i>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={handleVerify}>
                <div className="mb-6">
                  <input
                    type="text"
                    id="mfa-enroll-code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition placeholder:text-gray-300"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => { setStep('scan'); setError(''); setVerifyCode(''); }}
                    className="px-5 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || verifyCode.length !== 6}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Verifying…</>
                    ) : (
                      'Verify & Activate'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <i className="fa-solid fa-check text-2xl"></i>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">MFA Activated!</h3>
              <p className="text-sm text-gray-500 mb-4">
                Your account is now protected with two-factor authentication.
              </p>
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                <span className="text-sm">Redirecting to dashboard…</span>
              </div>
            </div>
          )}
        </div>

        {/* Skip option */}
        {(step === 'scan' || step === 'verify') && (
          <div className="text-center mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

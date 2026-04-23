'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function MfaChallengeClient() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState('');
  const inputRefs = useRef([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadFactors();
  }, []);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  const loadFactors = async () => {
    const { data, error: listError } = await supabase.auth.mfa.listFactors();

    if (listError || !data?.totp?.[0]) {
      router.push('/mfa/enroll');
      return;
    }

    setFactorId(data.totp[0].id);
  };

  const handleInput = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);

    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (fullCode) => {
    if (!factorId) return;
    setLoading(true);
    setError('');

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: fullCode,
      });

      if (verifyError) throw verifyError;

      router.push('/dashboard');
    } catch {
      setError('Invalid verification code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }

    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
            <i className="fa-solid fa-fingerprint text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Verification</h1>
          <p className="text-gray-500 text-sm mt-2">
            Enter the code from your authenticator app
          </p>
        </div>

        <div className="glass-card rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-8">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-center space-x-2 animate-fade-in-up">
              <i className="fa-solid fa-circle-exclamation text-red-500 text-sm flex-shrink-0"></i>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center space-x-3 mb-8" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl otp-input focus:outline-none transition-all duration-200 bg-white"
                  disabled={loading}
                />
              ))}
            </div>

            <button
              type="submit"
              id="mfa-verify-btn"
              disabled={loading || code.join('').length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Verifying…</>
              ) : (
                <>
                  <i className="fa-solid fa-shield-halved mr-2 text-sm"></i>
                  Verify Identity
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              <i className="fa-solid fa-clock mr-1"></i>
              Codes refresh every 30 seconds
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i>
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

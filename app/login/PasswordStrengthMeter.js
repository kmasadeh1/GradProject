'use client';

/**
 * Dynamic password strength meter.
 * Evaluates: length, uppercase, lowercase, digit, special character.
 * Shows an animated gradient bar and checklist.
 */
export default function PasswordStrengthMeter({ password }) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const score = checks.filter((c) => c.met).length;

  const getStrength = () => {
    if (score === 0) return { label: '', color: '', width: '0%' };
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', width: '25%' };
    if (score === 3) return { label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-600', width: '50%' };
    if (score === 4) return { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-600', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600', width: '100%' };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <div className="mb-4 mt-3 animate-fade-in-up">
      {/* Animated Strength Bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full strength-bar ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>

      {/* Label + Score */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold ${strength.textColor}`}>
          {strength.label}
        </span>
        <span className="text-xs text-gray-400">{score}/5 checks passed</span>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center space-x-1.5">
            <i
              className={`text-[10px] ${
                check.met
                  ? 'fa-solid fa-circle-check text-emerald-500'
                  : 'fa-regular fa-circle text-gray-300'
              }`}
            ></i>
            <span className={`text-xs ${check.met ? 'text-gray-600' : 'text-gray-400'}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

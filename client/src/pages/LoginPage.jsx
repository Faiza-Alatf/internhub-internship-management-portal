
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  BriefcaseBusiness,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Feedback';
import { Field, inputClass } from '../components/ui/Controls';
import { isEmail } from '../utils/validators';

const DEMO = [
  {
    role: 'Admin',
    email: 'admin@internportal.com',
    password: 'Admin@123',
    icon: ShieldCheck,
  },
  {
    role: 'Mentor',
    email: 'mentor@internportal.com',
    password: 'Mentor@123',
    icon: Users,
  },
  {
    role: 'Intern',
    email: 'intern@internportal.com',
    password: 'Intern@123',
    icon: BriefcaseBusiness,
  },
];

const JOURNEY = [
  { label: 'Onboard', x: 35, y: 235 },
  { label: 'Learn', x: 145, y: 175 },
  { label: 'Deliver', x: 260, y: 190 },
  { label: 'Review', x: 375, y: 105 },
  { label: 'Complete', x: 490, y: 55 },
];

function JourneyIllustration() {
  return (
    <svg
      viewBox="0 0 530 285"
      className="w-full overflow-visible"
      role="img"
      aria-label="Internship journey from onboarding to completion"
    >
      <defs>
        <linearGradient id="journeyGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>

      {/* Decorative background circles */}
      <circle cx="375" cy="100" r="88" fill="#ffffff" opacity="0.025" />
      <circle cx="375" cy="100" r="65" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
      <circle cx="90" cy="65" r="36" fill="#14b8a6" opacity="0.07" />

      {/* Journey path */}
      <path
        d="M35 235 C85 235 95 175 145 175 S210 190 260 190 S325 105 375 105 S440 55 490 55"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.14"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <path
        d="M35 235 C85 235 95 175 145 175 S210 190 260 190 S325 105 375 105"
        fill="none"
        stroke="url(#journeyGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      <path
        d="M375 105 S440 55 490 55"
        fill="none"
        stroke="#5eead4"
        strokeWidth="3"
        strokeDasharray="4 8"
        strokeLinecap="round"
      />

      {JOURNEY.map((stop, index) => (
        <g key={stop.label}>
          <circle
            cx={stop.x}
            cy={stop.y}
            r="17"
            fill="#0f3039"
            stroke="#5eead4"
            strokeWidth="1.5"
          />

          <circle
            cx={stop.x}
            cy={stop.y}
            r="11"
            fill={index === 4 ? 'none' : '#5eead4'}
            fillOpacity="0.16"
          />

          {index < 4 ? (
            <path
              d={`M${stop.x - 4} ${stop.y} l3 3 l5 -6`}
              fill="none"
              stroke="#99f6e4"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d={`M${stop.x - 5} ${stop.y} l4 4 l7 -9`}
              fill="none"
              stroke="#99f6e4"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          <text
            x={stop.x}
            y={stop.y + 35}
            textAnchor="middle"
            fill="#d1e4e8"
            fontSize="12"
            fontWeight="500"
          >
            {stop.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerError('');
  };

  const submit = async (e) => {
    e.preventDefault();

    const next = {};

    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!isEmail(form.email.trim())) {
      next.email = 'Enter a valid email address';
    }

    if (!form.password) {
      next.password = 'Password is required';
    }

    setErrors(next);

    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError('');

    try {
      const user = await login(
        form.email.trim(),
        form.password,
        form.remember
      );

      toast.success(
        `Welcome back, ${user.fullName.split(' ')[0]}!`
      );

      navigate(location.state?.from?.pathname || '/', {
        replace: true,
      });
    } catch (err) {
      setServerError(
        err.message || 'Unable to log in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demo) => {
    setForm((current) => ({
      ...current,
      email: demo.email,
      password: demo.password,
    }));
    setErrors({});
    setServerError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid lg:grid-cols-2">

      {/* LEFT PANEL */}
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-[#102b35] to-[#104c4b] px-12 py-10 text-white lg:flex xl:px-16">

        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full border border-teal-200/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border border-teal-200/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20 transition duration-300 hover:rotate-[-5deg] hover:scale-105">
            <GraduationCap size={27} strokeWidth={2.2} />
          </div>

          <div>
            <p className="text-xl font-bold tracking-tight">
              Intern<span className="text-teal-300">Hub</span>
            </p>
            <p className="mt-0.5 text-xs tracking-wide text-slate-400">
              INTERNSHIP MANAGEMENT PORTAL
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 mx-auto my-12 w-full max-w-xl">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/[0.08] px-3.5 py-2 text-xs font-medium text-teal-200">
            <Sparkles size={14} />
            Your next chapter starts here
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-[1.2] tracking-tight xl:text-5xl">
            Turn your
            <span className="block text-teal-300">
              potential into
            </span>
            <span className="block">real experience.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            One workspace for managing internships, tracking
            progress, collaborating with mentors, and celebrating
            every milestone.
          </p>

          {/* Journey card */}
          <div className="mt-10 rounded-3xl border border-white/[0.09] bg-white/[0.04] p-5 shadow-2xl shadow-black/10 backdrop-blur-sm transition duration-300 hover:border-teal-200/20 hover:bg-white/[0.06] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Your internship journey
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Every step brings you closer.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/10 text-teal-300">
                <BriefcaseBusiness size={20} />
              </div>
            </div>

            <div className="mt-4">
              <JourneyIllustration />
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-4">
              {[
                { value: '01', label: 'Get started' },
                { value: '02', label: 'Build skills' },
                { value: '03', label: 'Make an impact' },
              ].map((item) => (
                <div key={item.value}>
                  <p className="text-lg font-semibold text-teal-300">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} InternHub</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            Learn. Grow. Succeed.
          </span>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-10 xl:px-16">

        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-teal-400/[0.08] blur-3xl lg:hidden" />
        <div className="pointer-events-none absolute -bottom-32 -left-28 h-72 w-72 rounded-full bg-emerald-400/[0.07] blur-3xl" />

        <div className="relative z-10 w-full max-w-[440px] animate-page">

          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
              <GraduationCap size={25} />
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Intern<span className="text-teal-600 dark:text-teal-400">Hub</span>
              </p>
              <p className="text-[10px] tracking-wider text-slate-500 dark:text-slate-400">
                INTERNSHIP MANAGEMENT PORTAL
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_60px_-20px_rgba(15,23,42,0.15)] sm:p-9 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20">
                <LogIn size={23} />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px] dark:text-white">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Sign in to continue your internship journey.
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                <span>{serverError}</span>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={submit} noValidate className="space-y-5">

              <Field label="Email address" error={errors.email}>
                <div className="group relative mt-1">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400"
                  />

                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    className={`${inputClass(errors.email)} !h-12 !rounded-xl !border-slate-200 !bg-slate-50/70 !pl-11 !pr-4 !text-sm !transition-all !duration-200 hover:!border-slate-300 focus:!border-teal-500 focus:!bg-white focus:!ring-4 focus:!ring-teal-500/10 dark:!border-slate-700 dark:!bg-slate-800/60 dark:hover:!border-slate-600 dark:focus:!border-teal-400 dark:focus:!bg-slate-800`}
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>
              </Field>

              <Field label="Password" error={errors.password}>
                <div className="group relative mt-1">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400"
                  />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    className={`${inputClass(errors.password)} !h-12 !rounded-xl !border-slate-200 !bg-slate-50/70 !pl-11 !pr-12 !text-sm !transition-all !duration-200 hover:!border-slate-300 focus:!border-teal-500 focus:!bg-white focus:!ring-4 focus:!ring-teal-500/10 dark:!border-slate-700 dark:!bg-slate-800/60 dark:hover:!border-slate-600 dark:focus:!border-teal-400 dark:focus:!bg-slate-800`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </Field>

              {/* Remember me */}
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => set('remember', e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:border-slate-600 dark:focus:ring-offset-slate-900"
                />
                Remember me for 7 days
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-teal-500 hover:to-emerald-500 hover:shadow-xl hover:shadow-teal-700/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to your account
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Explore demo accounts
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Select a role to autofill its login details.
                  </p>
                </div>

                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                  Demo
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {DEMO.map((demo) => {
                  const Icon = demo.icon;
                  const selected =
                    form.email === demo.email &&
                    form.password === demo.password;

                  return (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => fillDemo(demo)}
                      aria-pressed={selected}
                      className={`group flex min-w-0 flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 ${
                        selected
                          ? 'border-teal-500 bg-teal-50 shadow-sm dark:border-teal-400 dark:bg-teal-400/10'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/60 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-teal-500/60 dark:hover:bg-teal-400/5'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ${
                          selected
                            ? 'bg-teal-600 text-white dark:bg-teal-500'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-700 dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-teal-400/15 dark:group-hover:text-teal-300'
                        }`}
                      >
                        <Icon size={18} />
                      </span>

                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {demo.role}
                      </span>

                      {selected && (
                        <CheckCircle2
                          size={13}
                          className="text-teal-600 dark:text-teal-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom note */}
          <p className="mt-6 flex items-center justify-center gap-2 px-2 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            <ShieldCheck
              size={15}
              className="shrink-0 text-teal-600 dark:text-teal-400"
            />
            Secure access to your internship workspace
          </p>
        </div>
      </main>
    </div>
  );
}


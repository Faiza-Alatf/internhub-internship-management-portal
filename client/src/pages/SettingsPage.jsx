import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import useForm from '../hooks/useForm';
import { authApi } from '../services/resources';
import { PageHeader, Section } from '../components/ui/Cards';
import { Field, inputClass } from '../components/ui/Controls';
import { Spinner } from '../components/ui/Feedback';
import { checkRequired, isStrongPassword, PASSWORD_HINT } from '../utils/validators';

const PREF_KEY = 'ip_notification_prefs';
const PREFS = [['tasks', 'Task assignments and updates'], ['attendance', 'Attendance changes'], ['evaluations', 'Evaluations and mentor feedback']];
const loadPrefs = () => { try { return { tasks: true, attendance: true, evaluations: true, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; } catch { return { tasks: true, attendance: true, evaluations: true }; } };

function ProfileCard() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { values, errors, setErrors, bind } = useForm({ fullName: user.fullName });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const errs = checkRequired(values, { fullName: 'Full name' });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try { const res = await authApi.updateProfile({ fullName: values.fullName }); updateUser({ fullName: res.data.fullName }); toast.success(res.message); }
    catch (err) { setErrors(err.fieldErrors || {}); toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Section title="Profile" subtitle="Your name is shown across the portal.">
      <form onSubmit={submit} noValidate className="grid max-w-xl gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.fullName}><input className={inputClass(errors.fullName)} {...bind('fullName')} /></Field>
        <Field label="Email"><input className="input" value={user.email} disabled readOnly /></Field>
        <Field label="Role"><input className="input capitalize" value={user.role.toLowerCase()} disabled readOnly /></Field>
        <div className="flex items-end"><button className="btn-primary" disabled={saving}>{saving && <Spinner />} Save profile</button></div>
      </form>
    </Section>
  );
}

function PasswordCard() {
  const toast = useToast();
  const { values, errors, setErrors, bind } = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const errs = checkRequired(values, { currentPassword: 'Current password', newPassword: 'New password', confirmPassword: 'Confirmation' });
    if (!errs.newPassword && !isStrongPassword(values.newPassword)) errs.newPassword = PASSWORD_HINT;
    if (!errs.confirmPassword && values.confirmPassword !== values.newPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success(res.message); setErrors({}); e.target.reset();
    } catch (err) { setErrors(err.fieldErrors || {}); toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <Section title="Change password" subtitle="Use a strong password you do not use elsewhere.">
      <form onSubmit={submit} noValidate className="grid max-w-xl gap-4 sm:grid-cols-2" autoComplete="off">
        <Field label="Current password" required error={errors.currentPassword} className="sm:col-span-2"><input type="password" autoComplete="current-password" className={inputClass(errors.currentPassword)} {...bind('currentPassword')} /></Field>
        <Field label="New password" required error={errors.newPassword} hint={PASSWORD_HINT}><input type="password" autoComplete="new-password" className={inputClass(errors.newPassword)} {...bind('newPassword')} /></Field>
        <Field label="Confirm new password" required error={errors.confirmPassword}><input type="password" autoComplete="new-password" className={inputClass(errors.confirmPassword)} {...bind('confirmPassword')} /></Field>
        <div><button className="btn-primary" disabled={saving}>{saving && <Spinner />} Update password</button></div>
      </form>
    </Section>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [prefs, setPrefs] = useState(loadPrefs);
  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); toast.success('Notification preferences saved'); } catch { /* ignore */ }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and how the portal looks." />
      <div className="grid gap-4">
        <ProfileCard />
        <PasswordCard />
        <Section title="Notification preferences" subtitle="Saved on this device.">
          <ul className="max-w-xl divide-y divide-ink-100 dark:divide-ink-800">
            {PREFS.map(([key, label]) => (
              <li key={key} className="flex items-center justify-between py-3">
                <span className="text-sm text-ink-700 dark:text-ink-200">{label}</span>
                <button role="switch" aria-checked={prefs[key]} aria-label={label} onClick={() => toggle(key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${prefs[key] ? 'bg-brand-600' : 'bg-ink-300 dark:bg-ink-600'}`}>
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-5' : ''}`} />
                </button>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Theme" subtitle="Your choice is remembered on this device.">
          <div className="flex gap-3">
            {[['light', 'Light', Sun], ['dark', 'Dark', Moon]].map(([value, label, Icon]) => (
              <button key={value} onClick={() => setTheme(value)} aria-pressed={theme === value}
                className={`flex w-36 items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${theme === value ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-ink-200 text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'}`}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
export const isStrongPassword = (v) => typeof v === 'string' && v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v);
export const PASSWORD_HINT = 'At least 8 characters with uppercase, lowercase and a number';

// checkRequired(values, { email: 'Email', fullName: 'Full name' }) -> { email: 'Email is required' }
export function checkRequired(values, labels) {
  const errors = {};
  Object.entries(labels).forEach(([field, label]) => {
    const v = values[field];
    if (v === undefined || v === null || String(v).trim() === '') errors[field] = `${label} is required`;
  });
  return errors;
}

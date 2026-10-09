const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// Accepts 'YYYY-MM-DD' (treated as a local date) or a full ISO timestamp
export function parseDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const fmtDate = (v) => { const d = parseDate(v); return d ? `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '-'; };
export const fmtShortDate = (v) => { const d = parseDate(v); return d ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : '-'; };
export const fmtMonth = (v) => { const [y, m] = String(v).split('-'); return `${MONTHS[Number(m) - 1] || ''} ${y}`; };
export const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return '';
  const seconds = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  const steps = [[86400, 'd'], [3600, 'h'], [60, 'm']];
  for (const [size, unit] of steps) if (seconds >= size) return `${Math.floor(seconds / size)}${unit} ago`;
  return 'just now';
}

export const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
export const firstName = (name = '') => name.trim().split(/\s+/)[0];

// 4.6 -> "Excellent"
export function ratingLabel(rating) {
  const r = Number(rating);
  if (!r) return 'Not rated';
  if (r >= 4.5) return 'Excellent';
  if (r >= 3.5) return 'Good';
  if (r >= 2.5) return 'Satisfactory';
  return 'Needs improvement';
}
export const ratingTone = (rating) => (Number(rating) >= 4.5 ? 'green' : Number(rating) >= 3.5 ? 'blue' : Number(rating) >= 2.5 ? 'amber' : 'red');

// "BS Software Engineering" -> "Software Engineering Intern"
export const internTitle = (degree = '') => `${degree.replace(/^(BS|BSc|BE|BBA|MS|MSc|MBA)\s+/i, '') || 'General'} Intern`;

// Percentage of the internship that has already passed
export function internshipProgress(start, end) {
  const s = parseDate(start); const e = parseDate(end);
  if (!s || !e) return 0;
  const pct = ((Date.now() - s.getTime()) / (e.getTime() - s.getTime())) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

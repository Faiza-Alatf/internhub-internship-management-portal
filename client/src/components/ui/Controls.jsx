import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Star, X } from 'lucide-react';
import { useState } from 'react';
import { Spinner } from './Feedback';

export const inputClass = (error) => `input ${error ? 'input-error' : ''}`;

// Label + input + error message. Wrapping in <label> links the text to the input for accessibility.
export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}{required && <span className="text-rose-500"> *</span>}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>}
    </label>
  );
}

export function SelectOptions({ items, valueKey, labelKey, placeholder }) {
  return (
    <>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {items.map((item) => <option key={item[valueKey]} value={item[valueKey]}>{typeof labelKey === 'function' ? labelKey(item) : item[labelKey]}</option>)}
    </>
  );
}

// Icon button with a tooltip. Pass "to" for a link instead of a button.
export function IconButton({ icon: Icon, label, onClick, to, danger = false, disabled = false }) {
  const cls = `group icon-btn ${danger ? 'hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10' : ''}`;
  const content = (<><Icon size={16} /><span className="tooltip" role="tooltip">{label}</span></>);
  return to
    ? <Link to={to} className={cls} aria-label={label}>{content}</Link>
    : <button type="button" onClick={onClick} disabled={disabled} className={cls} aria-label={label}>{content}</button>;
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
      <input className="input pl-9 pr-8" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" aria-label="Clear search"><X size={14} /></button>
      )}
    </div>
  );
}

const BAR_TONES = { brand: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500', blue: 'bg-sky-500' };
export function ProgressBar({ value = 0, tone = 'brand', className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800 ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-700 ${BAR_TONES[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Pill-style tab / filter switcher
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800" role="tablist" aria-label={label}>
      {options.map((opt) => {
        const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
        const active = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-700 dark:text-white' : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-100'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// 1-5 star rating input (keyboard accessible)
export function StarInput({ value, onChange, error }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className="rounded p-0.5 transition-transform hover:scale-110">
          <Star size={22} className={n <= shown ? 'fill-amber-400 text-amber-400' : error ? 'text-rose-300' : 'text-ink-300 dark:text-ink-600'} />
        </button>
      ))}
      <span className="ml-2 w-6 text-sm font-medium text-ink-600 dark:text-ink-300">{value || '-'}</span>
    </div>
  );
}

// Cancel + Save buttons used in the footer of form modals (submit is linked to the form by id)
export function FormFooter({ formId, saving, onCancel, label = 'Save' }) {
  return (
    <>
      <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      <button type="submit" form={formId} className="btn-primary" disabled={saving}>{saving && <Spinner />}{saving ? 'Saving...' : label}</button>
    </>
  );
}

// Page numbers + "Showing 1-8 of 20"
export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 text-sm dark:border-ink-800 sm:flex-row">
      <p className="text-ink-500">Showing {from}-{to} of {total}</p>
      <div className="flex items-center gap-1">
        <button className="icon-btn" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
        {nums.map((n, i) => (
          <span key={n} className="flex items-center">
            {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-ink-400">...</span>}
            <button onClick={() => onChange(n)} aria-current={n === page} className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors ${n === page ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'}`}>{n}</button>
          </span>
        ))}
        <button className="icon-btn" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
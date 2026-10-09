import { useEffect, useState } from 'react';
import { CalendarCheck, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import { attendanceApi, internsApi } from '../services/resources';
import { PageHeader, Section, StatCard } from '../components/ui/Cards';
import { EmptyState, ErrorState, Skeleton, Spinner, TableSkeleton } from '../components/ui/Feedback';
import { ProgressBar, SelectOptions } from '../components/ui/Controls';
import { StatusBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { MonthlyAttendanceChart } from '../components/charts/Charts';
import { fmtDate, fmtMonth, todayStr } from '../utils/format';

const STATUSES = ['Present', 'Late', 'Absent', 'Leave'];
const ACTIVE_STYLE = { Present: 'bg-emerald-600 text-white', Late: 'bg-amber-500 text-white', Absent: 'bg-rose-600 text-white', Leave: 'bg-violet-600 text-white' };
const DEFAULTS = { status: 'Present', checkInTime: '09:00', checkOutTime: '17:00' };

// ADMIN / MENTOR: mark attendance for a day
function RecordPanel() {
  const toast = useToast();
  const [date, setDate] = useState(todayStr());
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const interns = useFetch(() => internsApi.list({ status: 'Active' }), []);
  const existing = useFetch(() => attendanceApi.list({ date }), [date]);

  // Pre-fill the form from what is already saved in SQL Server for this date
  useEffect(() => {
    if (!interns.data || !existing.data) return;
    const next = {};
    interns.data.forEach((i) => {
      const rec = existing.data.find((r) => r.internId === i.internId);
      next[i.internId] = rec ? { status: rec.status, checkInTime: rec.checkInTime || '', checkOutTime: rec.checkOutTime || '' } : { ...DEFAULTS };
    });
    setMarks(next);
  }, [interns.data, existing.data]);

  const update = (id, changes) => setMarks((m) => ({ ...m, [id]: { ...m[id], ...changes } }));
  const save = async () => {
    const records = Object.entries(marks).map(([internId, m]) => ({ internId: Number(internId), attendanceDate: date, ...m }));
    setSaving(true);
    try { const res = await attendanceApi.record({ records }); toast.success(res.message); existing.reload(); window.dispatchEvent(new Event('attendance:saved')); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const loading = interns.loading || existing.loading;
  return (
    <Section title="Mark attendance" subtitle="Choose a date, set each intern's status, then save." className="mb-4" bodyClass="p-0"
      actions={<input type="date" className="input !w-auto" value={date} max={todayStr()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Attendance date" />}>
      {loading ? <TableSkeleton rows={4} cols={4} /> : interns.error || existing.error ? <ErrorState error={interns.error || existing.error} onRetry={() => { interns.reload(); existing.reload(); }} />
        : !interns.data.length ? <EmptyState icon={CalendarCheck} title="No active interns" description="Active interns assigned to you will appear here." /> : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr>{['Intern', 'Status', 'Check-in', 'Check-out'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {interns.data.map((i) => {
                    const m = marks[i.internId] || DEFAULTS;
                    const worked = m.status === 'Present' || m.status === 'Late';
                    return (
                      <tr key={i.internId} className="tr-hover">
                        <td className="td"><div className="flex items-center gap-3"><Avatar name={i.fullName} size="sm" /><span className="font-medium text-ink-900 dark:text-ink-50">{i.fullName}</span></div></td>
                        <td className="td"><div className="inline-flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800" role="group" aria-label={`Status for ${i.fullName}`}>
                          {STATUSES.map((s) => <button key={s} type="button" aria-pressed={m.status === s} onClick={() => update(i.internId, { status: s, ...(s === 'Present' || s === 'Late' ? { checkInTime: m.checkInTime || (s === 'Late' ? '09:20' : '09:00'), checkOutTime: m.checkOutTime || '17:00' } : {}) })}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${m.status === s ? ACTIVE_STYLE[s] : 'text-ink-600 hover:bg-white dark:text-ink-300 dark:hover:bg-ink-700'}`}>{s}</button>)}
                        </div></td>
                        <td className="td"><input type="time" className="input !w-32 !py-1" disabled={!worked} value={worked ? m.checkInTime : ''} onChange={(e) => update(i.internId, { checkInTime: e.target.value })} aria-label="Check-in time" /></td>
                        <td className="td"><input type="time" className="input !w-32 !py-1" disabled={!worked} value={worked ? m.checkOutTime : ''} onChange={(e) => update(i.internId, { checkOutTime: e.target.value })} aria-label="Check-out time" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t border-ink-100 p-4 dark:border-ink-800"><button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : <Save size={16} />} Save attendance</button></div>
          </>
        )}
    </Section>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isStaff = user.role !== 'INTERN';
  const [internId, setInternId] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => { const on = () => setRefresh((r) => r + 1); window.addEventListener('attendance:saved', on); return () => window.removeEventListener('attendance:saved', on); }, []);

  const interns = useFetch(() => (isStaff ? internsApi.list() : Promise.resolve([])), [isStaff]);
  const history = useFetch(() => attendanceApi.list({ internId: internId || undefined, status: status || undefined, date: date || undefined }), [internId, status, date, refresh]);
  const monthly = useFetch(() => attendanceApi.monthly({ internId: internId || undefined }), [internId, refresh]);

  const rows = history.data || [];
  const count = (s) => rows.filter((r) => r.status === s).length;
  const counted = rows.length - count('Leave');
  const rate = counted ? ((count('Present') + count('Late')) / counted) * 100 : 0;
  const hasFilters = internId || status || date;

  return (
    <>
      <PageHeader title="Attendance" subtitle={isStaff ? 'Record daily attendance and review history.' : 'Your attendance history and monthly summary.'} />
      {isStaff && <RecordPanel />}

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Section title="Attendance rate" subtitle={hasFilters ? 'Based on the filtered records' : 'Present or late days, excluding leave'}>
          {history.loading ? <Skeleton className="h-32" /> : (
            <>
              <p className="text-4xl font-semibold text-ink-900 dark:text-ink-50">{rate.toFixed(0)}%</p>
              <ProgressBar value={rate} tone={rate >= 85 ? 'green' : rate >= 70 ? 'amber' : 'red'} className="mt-3 !h-3" />
              <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                {STATUSES.map((s) => <div key={s} className="rounded-lg bg-ink-50 py-2 dark:bg-ink-800/60"><p className="text-lg font-semibold text-ink-900 dark:text-ink-50">{count(s)}</p><p className="text-xs text-ink-500">{s}</p></div>)}
              </div>
            </>
          )}
        </Section>
        {monthly.loading ? <Skeleton className="h-72 rounded-xl" /> : monthly.error ? <div className="card"><ErrorState error={monthly.error} onRetry={monthly.reload} /></div> : <MonthlyAttendanceChart data={monthly.data} fmt={fmtMonth} />}
      </div>

      <Section title="Attendance history" bodyClass="p-0"
        actions={<div className="flex flex-wrap gap-2">
          {isStaff && <select className="input !w-44" value={internId} onChange={(e) => setInternId(e.target.value)} aria-label="Filter by intern"><SelectOptions items={interns.data || []} valueKey="internId" labelKey="fullName" placeholder="All interns" /></select>}
          <select className="input !w-32" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <input type="date" className="input !w-40" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
        </div>}>
        {history.loading ? <TableSkeleton rows={6} cols={5} /> : history.error ? <ErrorState error={history.error} onRetry={history.reload} /> : !rows.length ? (
          <EmptyState icon={CalendarCheck} title="No attendance records" description={hasFilters ? 'There are currently no records matching your filters.' : 'Attendance will appear here once it is recorded.'} />
        ) : (
          <div className="max-h-[28rem] overflow-auto">
            <table className="table">
              <thead><tr>{['Date', ...(isStaff ? ['Intern'] : []), 'Status', 'Check-in', 'Check-out'].map((h) => <th key={h} className="th sticky top-0">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.attendanceId} className="tr-hover">
                  <td className="td">{fmtDate(r.attendanceDate)}</td>
                  {isStaff && <td className="td">{r.internName}</td>}
                  <td className="td"><StatusBadge value={r.status} /></td>
                  <td className="td">{r.checkInTime || '-'}</td><td className="td">{r.checkOutTime || '-'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}

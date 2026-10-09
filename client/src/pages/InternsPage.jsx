 import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useForm from '../hooks/useForm';
import { departmentsApi, internsApi, mentorsApi } from '../services/resources';
import { PageHeader } from '../components/ui/Cards';
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/Feedback';
import { Field, FormFooter, IconButton, Pagination, ProgressBar, SearchInput, SelectOptions, inputClass } from '../components/ui/Controls';
import { StatusBadge } from '../components/ui/Badge';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { checkRequired, isEmail, isStrongPassword, PASSWORD_HINT } from '../utils/validators';
import { fmtDate, ratingLabel } from '../utils/format';

const STATUSES = ['Active', 'Completed', 'On Hold', 'Terminated'];
const EMPTY_FORM = { fullName: '', email: '', password: '', departmentId: '', mentorId: '', university: '', degree: '', semester: '', startDate: '', endDate: '', status: 'Active' };

function InternFormModal({ intern, departments, mentors, onClose, onSaved }) {
  const toast = useToast();
  const editing = !!intern;
  const { values, errors, setErrors, bind } = useForm(editing ? { ...EMPTY_FORM, ...intern, mentorId: intern.mentorId ?? '' } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const labels = { fullName: 'Full name', email: 'Email', departmentId: 'Department', university: 'University', degree: 'Degree', semester: 'Semester', startDate: 'Start date', endDate: 'End date' };
    if (!editing) labels.password = 'Password';
    const errs = checkRequired(values, labels);
    if (!errs.email && !isEmail(values.email)) errs.email = 'Enter a valid email address';
    if (!editing && !errs.password && !isStrongPassword(values.password)) errs.password = PASSWORD_HINT;
    if (!errs.startDate && !errs.endDate && values.endDate < values.startDate) errs.endDate = 'End date cannot be before the start date';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { ...values, mentorId: values.mentorId || null };
      const res = editing ? await internsApi.update(intern.internId, payload) : await internsApi.create(payload);
      toast.success(res.message);
      onSaved();
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.message);
      setSaving(false);
    }
  };

  const mentorsInDept = mentors.filter((m) => !values.departmentId || String(m.departmentId) === String(values.departmentId));

  return (
    <Modal open onClose={saving ? () => {} : onClose} size="lg" title={editing ? 'Edit intern' : 'Add intern'}
      subtitle={editing ? 'Update profile and internship details.' : 'Creates a login account and an internship profile.'}
      footer={<FormFooter formId="intern-form" saving={saving} onCancel={onClose} label={editing ? 'Save changes' : 'Add intern'} />}>
      <form id="intern-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.fullName}><input className={inputClass(errors.fullName)} placeholder="e.g. Faiza Altaf" {...bind('fullName')} /></Field>
        <Field label="Email" required error={errors.email}><input type="email" className={inputClass(errors.email)} placeholder="name@company.com" {...bind('email')} /></Field>
        {!editing && <Field label="Temporary password" required error={errors.password} hint={PASSWORD_HINT} className="sm:col-span-2"><input type="password" autoComplete="new-password" className={inputClass(errors.password)} {...bind('password')} /></Field>}
        <Field label="Department" required error={errors.departmentId}>
          <select className={inputClass(errors.departmentId)} {...bind('departmentId')}><SelectOptions items={departments} valueKey="departmentId" labelKey="departmentName" placeholder="Select department" /></select>
        </Field>
        <Field label="Mentor" error={errors.mentorId} hint="Optional - can be assigned later">
          <select className={inputClass(errors.mentorId)} {...bind('mentorId')}><SelectOptions items={mentorsInDept} valueKey="mentorId" labelKey={(m) => `${m.fullName} (${m.departmentName})`} placeholder="No mentor yet" /></select>
        </Field>
        <Field label="University" required error={errors.university}><input className={inputClass(errors.university)} placeholder="e.g. Bahria University" {...bind('university')} /></Field>
        <Field label="Degree" required error={errors.degree}><input className={inputClass(errors.degree)} placeholder="e.g. BS Software Engineering" {...bind('degree')} /></Field>
        <Field label="Semester" required error={errors.semester}><input className={inputClass(errors.semester)} placeholder="e.g. 7th" {...bind('semester')} /></Field>
        <Field label="Status" error={errors.status}><select className={inputClass(errors.status)} {...bind('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Start date" required error={errors.startDate}><input type="date" className={inputClass(errors.startDate)} {...bind('startDate')} /></Field>
        <Field label="End date" required error={errors.endDate}><input type="date" className={inputClass(errors.endDate)} min={values.startDate || undefined} {...bind('endDate')} /></Field>
      </form>
    </Modal>
  );
}

export default function InternsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);       // null | { intern? }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debouncedSearch = useDebounce(search);

  const filters = { search: debouncedSearch || undefined, departmentId: departmentId || undefined, status: status || undefined };
  const { data: interns, loading, error, reload } = useFetch(() => internsApi.list(filters), [debouncedSearch, departmentId, status]);
  const { data: departments } = useFetch(() => departmentsApi.list(), []);
  const { data: mentors } = useFetch(() => (isAdmin ? mentorsApi.list() : Promise.resolve([])), [isAdmin]);

  const hasFilters = search || departmentId || status;
  const clearFilters = () => { setSearch(''); setDepartmentId(''); setStatus(''); };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await internsApi.remove(toDelete.internId);
      toast.success(res.message);
      setToDelete(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };

  return (
    <>
      <PageHeader title={isAdmin ? 'Interns' : 'My interns'} subtitle={isAdmin ? 'Manage interns throughout their internship.' : 'Interns assigned to you.'}
        actions={isAdmin && <button className="btn-primary" onClick={() => setModal({})}><Plus size={16} /> Add intern</button>} />

      <div className="card">
        <div className="grid gap-3 border-b border-ink-100 p-4 dark:border-ink-800 sm:grid-cols-2 lg:grid-cols-[1fr_200px_180px_auto]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email" />
          <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Filter by department">
            <SelectOptions items={departments || []} valueKey="departmentId" labelKey="departmentName" placeholder="All departments" />
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {hasFilters && <button className="btn-ghost" onClick={clearFilters}>Clear filters</button>}
        </div>

        {loading ? <TableSkeleton rows={6} cols={6} />
          : error ? <ErrorState error={error} onRetry={reload} />
            : !interns.length ? (
              <EmptyState icon={GraduationCap} title="No interns found"
                description={hasFilters ? 'There are currently no interns matching your search.' : 'There are no interns yet.'}
                action={isAdmin && <button className="btn-primary" onClick={() => setModal({})}><Plus size={16} /> Add intern</button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr>{['Intern', 'Department', 'Mentor', 'Start date', 'End date', 'Status', 'Performance', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                  <tbody>
                    {interns.map((i) => (
                      <tr key={i.internId} className="tr-hover">
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <Avatar name={i.fullName} src={i.profileImage} />
                            <div><Link to={`/interns/${i.internId}`} className="font-medium text-ink-900 hover:text-brand-600 dark:text-ink-50">{i.fullName}</Link><p className="text-xs text-ink-500">{i.email}</p></div>
                          </div>
                        </td>
                        <td className="td">{i.departmentName}</td>
                        <td className="td">{i.mentorName || <span className="text-ink-400">Unassigned</span>}</td>
                        <td className="td">{fmtDate(i.startDate)}</td>
                        <td className="td">{fmtDate(i.endDate)}<p className="text-xs text-ink-500">{i.durationDays} days</p></td>
                        <td className="td"><StatusBadge value={i.status} /></td>
                        <td className="td">
                          {i.performance ? (
                            <div className="w-28"><div className="mb-1 flex justify-between text-xs"><span className="font-medium text-ink-900 dark:text-ink-50">{Number(i.performance).toFixed(1)}/5</span><span className="text-ink-500">{ratingLabel(i.performance)}</span></div><ProgressBar value={(i.performance / 5) * 100} /></div>
                          ) : <span className="text-xs text-ink-400">Not evaluated</span>}
                        </td>
                        <td className="td">
                          <div className="flex gap-1">
                            <IconButton icon={Eye} label="View" to={`/interns/${i.internId}`} />
                            {isAdmin && <IconButton icon={Pencil} label="Edit" onClick={() => setModal({ intern: i })} />}
                            {isAdmin && <IconButton icon={Trash2} label="Delete" danger onClick={() => setToDelete(i)} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>

      {modal && <InternFormModal intern={modal.intern} departments={departments || []} mentors={mentors || []} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} confirmLabel="Delete intern" title="Delete intern?"
        message={`${toDelete?.fullName} will lose access to the portal and be marked as Terminated. Their tasks, attendance and evaluations are kept for your records.`} />
    </>
  );
}

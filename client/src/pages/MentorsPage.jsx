import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useForm from '../hooks/useForm';
import { departmentsApi, mentorsApi } from '../services/resources';
import { PageHeader } from '../components/ui/Cards';
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/Feedback';
import { Field, FormFooter, IconButton, SearchInput, SelectOptions, inputClass } from '../components/ui/Controls';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { checkRequired, isEmail, isStrongPassword, PASSWORD_HINT } from '../utils/validators';

function MentorFormModal({ mentor, departments, onClose, onSaved }) {
  const toast = useToast();
  const editing = !!mentor;
  const { values, errors, setErrors, bind } = useForm(editing ? { ...mentor } : { fullName: '', email: '', password: '', departmentId: '', position: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const labels = { fullName: 'Full name', email: 'Email', departmentId: 'Department', position: 'Position' };
    if (!editing) labels.password = 'Password';
    const errs = checkRequired(values, labels);
    if (!errs.email && !isEmail(values.email)) errs.email = 'Enter a valid email address';
    if (!editing && !errs.password && !isStrongPassword(values.password)) errs.password = PASSWORD_HINT;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = editing ? await mentorsApi.update(mentor.mentorId, values) : await mentorsApi.create(values);
      toast.success(res.message);
      onSaved();
    } catch (err) { setErrors(err.fieldErrors || {}); toast.error(err.message); setSaving(false); }
  };

  return (
    <Modal open onClose={saving ? () => {} : onClose} title={editing ? 'Edit mentor' : 'Add mentor'}
      footer={<FormFooter formId="mentor-form" saving={saving} onCancel={onClose} label={editing ? 'Save changes' : 'Add mentor'} />}>
      <form id="mentor-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.fullName}><input className={inputClass(errors.fullName)} placeholder="e.g. John Smith" {...bind('fullName')} /></Field>
        <Field label="Email" required error={errors.email}><input type="email" className={inputClass(errors.email)} {...bind('email')} /></Field>
        {!editing && <Field label="Temporary password" required error={errors.password} hint={PASSWORD_HINT} className="sm:col-span-2"><input type="password" autoComplete="new-password" className={inputClass(errors.password)} {...bind('password')} /></Field>}
        <Field label="Department" required error={errors.departmentId}><select className={inputClass(errors.departmentId)} {...bind('departmentId')}><SelectOptions items={departments} valueKey="departmentId" labelKey="departmentName" placeholder="Select department" /></select></Field>
        <Field label="Position" required error={errors.position}><input className={inputClass(errors.position)} placeholder="e.g. Senior Software Engineer" {...bind('position')} /></Field>
      </form>
    </Modal>
  );
}

export default function MentorsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debounced = useDebounce(search);
  const { data: mentors, loading, error, reload } = useFetch(() => mentorsApi.list({ search: debounced || undefined }), [debounced]);
  const { data: departments } = useFetch(() => departmentsApi.list(), []);

  const confirmDelete = async () => {
    setDeleting(true);
    try { const res = await mentorsApi.remove(toDelete.mentorId); toast.success(res.message); setToDelete(null); reload(); }
    catch (err) { toast.error(err.message); setToDelete(null); } finally { setDeleting(false); }
  };

  return (
    <>
      <PageHeader title="Mentors" subtitle="Manage mentors and the interns they guide."
        actions={<button className="btn-primary" onClick={() => setModal({})}><Plus size={16} /> Add mentor</button>} />
      <div className="card">
        <div className="border-b border-ink-100 p-4 dark:border-ink-800 sm:max-w-sm"><SearchInput value={search} onChange={setSearch} placeholder="Search by name or email" /></div>
        {loading ? <TableSkeleton rows={5} cols={6} /> : error ? <ErrorState error={error} onRetry={reload} /> : !mentors.length ? (
          <EmptyState icon={Users} title="No mentors found" description={search ? 'There are currently no mentors matching your search.' : 'Add your first mentor to start assigning interns.'}
            action={<button className="btn-primary" onClick={() => setModal({})}><Plus size={16} /> Add mentor</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr>{['Mentor', 'Department', 'Position', 'Interns', 'Tasks', 'Performance', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {mentors.map((m) => (
                  <tr key={m.mentorId} className="tr-hover">
                    <td className="td"><div className="flex items-center gap-3"><Avatar name={m.fullName} /><div><Link to={`/mentors/${m.mentorId}`} className="font-medium text-ink-900 hover:text-brand-600 dark:text-ink-50">{m.fullName}</Link><p className="text-xs text-ink-500">{m.email}</p></div></div></td>
                    <td className="td">{m.departmentName}</td>
                    <td className="td">{m.position}</td>
                    <td className="td">{m.internCount}</td>
                    <td className="td">{m.taskCount}</td>
                    <td className="td">{m.performance ? `${Number(m.performance).toFixed(1)} / 5` : <span className="text-ink-400">-</span>}</td>
                    <td className="td"><div className="flex gap-1">
                      <IconButton icon={Eye} label="View" to={`/mentors/${m.mentorId}`} />
                      <IconButton icon={Pencil} label="Edit" onClick={() => setModal({ mentor: m })} />
                      <IconButton icon={Trash2} label="Delete" danger onClick={() => setToDelete(m)} />
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && <MentorFormModal mentor={modal.mentor} departments={departments || []} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} confirmLabel="Delete mentor" title="Delete mentor?"
        message={`${toDelete?.fullName} will be deactivated and lose access. Mentors with active interns must have them reassigned first.`} />
    </>
  );
}

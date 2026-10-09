import { useState } from 'react';
import { BarChart3, Building2, Code2, GraduationCap, HeartHandshake, Pencil, PenTool, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import useForm from '../hooks/useForm';
import { departmentsApi } from '../services/resources';
import { PageHeader } from '../components/ui/Cards';
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/ui/Feedback';
import { Field, FormFooter, IconButton, inputClass } from '../components/ui/Controls';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import { checkRequired } from '../utils/validators';

// Picks an icon + colour from the department name (falls back to a building)
const DEPT_STYLES = [
  [/software|develop|engineer/i, Code2, 'from-indigo-500 to-violet-500'],
  [/quality|qa|test/i, ShieldCheck, 'from-emerald-500 to-teal-500'],
  [/design|ux|ui/i, PenTool, 'from-fuchsia-500 to-violet-500'],
  [/data|analytic/i, BarChart3, 'from-sky-500 to-blue-600'],
  [/human|hr|people/i, HeartHandshake, 'from-amber-400 to-orange-500'],
];
const deptStyle = (name) => DEPT_STYLES.find(([re]) => re.test(name)) || [null, Building2, 'from-slate-500 to-slate-700'];

function DepartmentModal({ department, onClose, onSaved }) {
  const toast = useToast();
  const editing = !!department;
  const { values, errors, setErrors, bind } = useForm({ departmentName: department?.departmentName || '', description: department?.description || '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = checkRequired(values, { departmentName: 'Department name' });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = editing ? await departmentsApi.update(department.departmentId, values) : await departmentsApi.create(values);
      toast.success(res.message); onSaved();
    } catch (err) { setErrors(err.fieldErrors || {}); toast.error(err.message); setSaving(false); }
  };

  return (
    <Modal open onClose={saving ? () => {} : onClose} size="sm" title={editing ? 'Edit department' : 'Add department'}
      footer={<FormFooter formId="dept-form" saving={saving} onCancel={onClose} label={editing ? 'Save changes' : 'Add department'} />}>
      <form id="dept-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Department name" required error={errors.departmentName}><input className={inputClass(errors.departmentName)} placeholder="e.g. Data Analytics" {...bind('departmentName')} /></Field>
        <Field label="Description" error={errors.description}><textarea rows={3} className={inputClass(errors.description)} placeholder="What does this team do?" {...bind('description')} /></Field>
      </form>
    </Modal>
  );
}

function DepartmentCard({ d, onEdit, onDelete }) {
  const [, Icon, gradient] = deptStyle(d.departmentName);
  return (
    <div className="card card-hover group flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-200 group-hover:scale-110 ${gradient}`}><Icon size={21} /></span>
        <div className="flex gap-1"><IconButton icon={Pencil} label="Edit" onClick={onEdit} /><IconButton icon={Trash2} label="Delete" danger onClick={onDelete} /></div>
      </div>
      <h3 className="mt-3 font-semibold text-ink-900 dark:text-ink-50">{d.departmentName}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-ink-500">{d.description || 'No description added.'}</p>
      <p className="mt-3 flex-1 text-xs text-ink-500"><span className="font-medium text-ink-700 dark:text-ink-300">Mentors: </span>{d.mentorNames || 'None assigned'}</p>
      <div className="mt-4 flex gap-5 border-t border-ink-100 pt-3 text-sm text-ink-600 dark:border-ink-800 dark:text-ink-300">
        <span className="inline-flex items-center gap-1.5"><GraduationCap size={15} /> {d.internCount} interns</span>
        <span className="inline-flex items-center gap-1.5"><Users size={15} /> {d.mentorCount} mentors</span>
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => departmentsApi.list(), []);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    try { const res = await departmentsApi.remove(toDelete.departmentId); toast.success(res.message); setToDelete(null); reload(); }
    catch (err) { toast.error(err.message); setToDelete(null); } finally { setDeleting(false); }
  };

  return (
    <>
      <PageHeader title="Departments" subtitle="Teams that host interns and mentors."
        actions={<button className="btn-primary" onClick={() => setModal({})}><Plus size={16} /> Add department</button>} />
      {loading ? <CardGridSkeleton count={6} height="h-40" /> : error ? <div className="card"><ErrorState error={error} onRetry={reload} /></div> : !data.length ? (
        <div className="card"><EmptyState icon={Building2} title="No departments yet" description="Create a department before adding interns and mentors." action={<button className="btn-primary" onClick={() => setModal({})}><Plus size={16} /> Add department</button>} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((d) => (
            <DepartmentCard key={d.departmentId} d={d} onEdit={() => setModal({ department: d })} onDelete={() => setToDelete(d)} />
          ))}
        </div>
      )}
      {modal && <DepartmentModal department={modal.department} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} confirmLabel="Delete department" title="Delete department?"
        message={`"${toDelete?.departmentName}" will be permanently removed. Departments that still have interns or mentors cannot be deleted.`} />
    </>
  );
}
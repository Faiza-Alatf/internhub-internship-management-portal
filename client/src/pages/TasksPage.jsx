import { useState } from 'react';
import { CalendarClock, KanbanSquare, LayoutList, MessageSquareText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useForm from '../hooks/useForm';
import { internsApi, tasksApi } from '../services/resources';
import { PageHeader } from '../components/ui/Cards';
import { EmptyState, ErrorState, Skeleton, TableSkeleton } from '../components/ui/Feedback';
import { Field, FormFooter, IconButton, SearchInput, SelectOptions, Segmented, inputClass } from '../components/ui/Controls';
import Badge, { StatusBadge } from '../components/ui/Badge';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { checkRequired } from '../utils/validators';
import { fmtDate, todayStr } from '../utils/format';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const COLUMNS = ['Pending', 'In Progress', 'Completed', 'Overdue'];
const SETTABLE = ['Pending', 'In Progress', 'Completed'];

function TaskFormModal({ task, interns, onClose, onSaved }) {
  const toast = useToast();
  const editing = !!task;
  const { values, errors, setErrors, bind } = useForm(editing
    ? { title: task.title, description: task.description || '', internId: task.internId, priority: task.priority, dueDate: task.dueDate, status: task.rawStatus, mentorComment: task.mentorComment || '' }
    : { title: '', description: '', internId: '', priority: 'Medium', dueDate: '', status: 'Pending', mentorComment: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = checkRequired(values, { title: 'Title', internId: 'Intern', dueDate: 'Due date' });
    if (!editing && !errs.dueDate && values.dueDate < todayStr()) errs.dueDate = 'Due date cannot be in the past';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = editing ? await tasksApi.update(task.taskId, values) : await tasksApi.create(values);
      toast.success(res.message); onSaved();
    } catch (err) { setErrors(err.fieldErrors || {}); toast.error(err.message); setSaving(false); }
  };

  return (
    <Modal open onClose={saving ? () => {} : onClose} title={editing ? 'Edit task' : 'Assign new task'}
      footer={<FormFooter formId="task-form" saving={saving} onCancel={onClose} label={editing ? 'Save changes' : 'Assign task'} />}>
      <form id="task-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Task title" required error={errors.title} className="sm:col-span-2"><input className={inputClass(errors.title)} placeholder="e.g. Implement Employee Authentication API" {...bind('title')} /></Field>
        <Field label="Description" error={errors.description} className="sm:col-span-2"><textarea rows={3} className={inputClass(errors.description)} {...bind('description')} /></Field>
        <Field label="Assign to intern" required error={errors.internId}>
          <select className={inputClass(errors.internId)} disabled={editing} {...bind('internId')}><SelectOptions items={interns} valueKey="internId" labelKey="fullName" placeholder="Select intern" /></select>
        </Field>
        <Field label="Priority" error={errors.priority}><select className={inputClass(errors.priority)} {...bind('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Due date" required error={errors.dueDate}><input type="date" className={inputClass(errors.dueDate)} min={editing ? undefined : todayStr()} {...bind('dueDate')} /></Field>
        {editing && <Field label="Status" error={errors.status}><select className={inputClass(errors.status)} {...bind('status')}>{SETTABLE.map((s) => <option key={s}>{s}</option>)}</select></Field>}
        {editing && <Field label="Mentor feedback on this task" error={errors.mentorComment} className="sm:col-span-2"><textarea rows={2} className={inputClass(errors.mentorComment)} placeholder="Review notes shown to the intern" {...bind('mentorComment')} /></Field>}
      </form>
    </Modal>
  );
}

function TaskCard({ task, isStaff, onStatus, onEdit, onDelete, busy }) {
  const overdue = task.status === 'Overdue';
  return (
    <article draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(task.taskId))}
      className={`card cursor-grab p-3.5 transition-shadow hover:shadow-md active:cursor-grabbing ${busy ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug text-ink-900 dark:text-ink-50">{task.title}</h4>
        {isStaff && <div className="-mr-1.5 -mt-1 flex shrink-0"><IconButton icon={Pencil} label="Edit" onClick={() => onEdit(task)} /><IconButton icon={Trash2} label="Delete" danger onClick={() => onDelete(task)} /></div>}
      </div>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-ink-500">{task.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge value={task.priority} dot={false} /><span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'font-medium text-rose-600' : 'text-ink-500'}`}><CalendarClock size={13} /> {fmtDate(task.dueDate)}</span></div>
      {task.mentorComment && <p className="mt-2.5 flex gap-1.5 rounded-lg bg-brand-50 p-2 text-xs text-brand-800 dark:bg-brand-500/10 dark:text-brand-200"><MessageSquareText size={14} className="mt-0.5 shrink-0" /> {task.mentorComment}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        {isStaff ? <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-500"><Avatar name={task.internName} size="xs" /><span className="truncate">{task.internName}</span></span> : <span />}
        <select aria-label={`Status of ${task.title}`} value={SETTABLE.includes(task.status) ? task.status : 'Pending'} onChange={(e) => onStatus(task, e.target.value)} disabled={busy} className="input !w-auto !py-1 !pl-2 !pr-7 text-xs">
          {SETTABLE.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
    </article>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isStaff = user.role !== 'INTERN';
  const [tab, setTab] = useState('All');
  const [view, setView] = useState('board');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [internId, setInternId] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const debounced = useDebounce(search);

  const params = { search: debounced || undefined, priority: priority || undefined, status: tab === 'All' ? undefined : tab, internId: internId || undefined, dueFrom: dueFrom || undefined, dueTo: dueTo || undefined };
  const { data: tasks, loading, error, reload } = useFetch(() => tasksApi.list(params), [debounced, priority, tab, internId, dueFrom, dueTo]);
  const { data: interns } = useFetch(() => (isStaff ? internsApi.list({ status: 'Active' }) : Promise.resolve([])), [isStaff]);

  const hasFilters = search || priority || internId || dueFrom || dueTo || tab !== 'All';
  const clear = () => { setSearch(''); setPriority(''); setInternId(''); setDueFrom(''); setDueTo(''); setTab('All'); };

  const changeStatus = async (task, status) => {
    if (status === task.status) return;
    setBusyId(task.taskId);
    try { const res = await tasksApi.update(task.taskId, { status }); toast.success(res.message); reload(); }
    catch (err) { toast.error(err.message); } finally { setBusyId(null); }
  };
  const onDrop = (e, column) => {
    e.preventDefault(); setDragOver(null);
    const task = tasks.find((t) => String(t.taskId) === e.dataTransfer.getData('text/plain'));
    if (task && SETTABLE.includes(column)) changeStatus(task, column);
    else if (task && column === 'Overdue') toast.info('Overdue is set automatically when a due date passes.');
  };
  const confirmDelete = async () => {
    setDeleting(true);
    try { const res = await tasksApi.remove(toDelete.taskId); toast.success(res.message); setToDelete(null); reload(); }
    catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };
  const addButton = isStaff && <button className="btn-primary" onClick={() => setModal({})}><Plus size={16} /> Assign task</button>;

  return (
    <>
      <PageHeader title={isStaff ? 'Tasks' : 'My tasks'} subtitle={isStaff ? 'Assign work and follow progress. Drag cards between columns to change status.' : 'Update your progress as you work. Drag a card or use its status menu.'} actions={addButton} />

      <div className="card mb-4 space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented label="Filter by status" options={['All', ...COLUMNS]} value={tab} onChange={setTab} />
          <div className="flex gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-800">
            {[['board', KanbanSquare, 'Board view'], ['table', LayoutList, 'Table view']].map(([v, Icon, label]) => (
              <button key={v} onClick={() => setView(v)} aria-label={label} aria-pressed={view === v} className={`rounded-md p-1.5 ${view === v ? 'bg-white shadow-sm dark:bg-ink-700' : 'text-ink-500'}`}><Icon size={18} /></button>
            ))}
          </div>
        </div>
        <div className={`grid gap-3 sm:grid-cols-2 ${isStaff ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
          <div className="lg:col-span-2"><SearchInput value={search} onChange={setSearch} placeholder="Search tasks" /></div>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority"><option value="">All priorities</option>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
          {isStaff && <select className="input" value={internId} onChange={(e) => setInternId(e.target.value)} aria-label="Filter by intern"><SelectOptions items={interns || []} valueKey="internId" labelKey="fullName" placeholder="All interns" /></select>}
          <input type="date" className="input" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} aria-label="Due from" title="Due from" />
          <input type="date" className="input" value={dueTo} min={dueFrom || undefined} onChange={(e) => setDueTo(e.target.value)} aria-label="Due to" title="Due to" />
        </div>
        {hasFilters && <button className="btn-ghost !px-2 !py-1 text-xs" onClick={clear}>Clear all filters</button>}
      </div>

      {loading ? (view === 'board' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{COLUMNS.map((c) => <Skeleton key={c} className="h-72 rounded-xl" />)}</div> : <div className="card"><TableSkeleton rows={6} cols={6} /></div>)
        : error ? <div className="card"><ErrorState error={error} onRetry={reload} /></div>
          : !tasks.length ? <div className="card"><EmptyState icon={KanbanSquare} title="No tasks found" description={hasFilters ? 'There are currently no tasks matching your filters.' : isStaff ? 'Assign the first task to an intern.' : 'You have no tasks right now.'} action={!hasFilters && addButton} /></div>
            : view === 'board' ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {COLUMNS.map((col) => {
                  const items = tasks.filter((t) => t.status === col);
                  return (
                    <section key={col} onDragOver={(e) => { e.preventDefault(); setDragOver(col); }} onDragLeave={() => setDragOver(null)} onDrop={(e) => onDrop(e, col)}
                      className={`rounded-xl border p-3 transition-colors ${dragOver === col ? 'border-brand-400 bg-brand-50/60 dark:bg-brand-500/10' : 'border-ink-100 bg-ink-100/50 dark:border-ink-800 dark:bg-ink-900/50'}`} aria-label={col}>
                      <header className="mb-3 flex items-center justify-between px-1"><h3 className="text-sm font-semibold text-ink-700 dark:text-ink-200">{col}</h3><Badge tone="slate" dot={false}>{items.length}</Badge></header>
                      <div className="space-y-3">
                        {items.map((t) => <TaskCard key={t.taskId} task={t} isStaff={isStaff} busy={busyId === t.taskId} onStatus={changeStatus} onEdit={(x) => setModal({ task: x })} onDelete={setToDelete} />)}
                        {!items.length && <p className="rounded-lg border border-dashed border-ink-200 py-6 text-center text-xs text-ink-400 dark:border-ink-700">No tasks</p>}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="table">
                  <thead><tr>{['Task', ...(isStaff ? ['Intern'] : ['Mentor']), 'Priority', 'Due date', 'Status', ...(isStaff ? ['Actions'] : [])].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.taskId} className="tr-hover">
                        <td className="td max-w-xs"><p className="truncate font-medium text-ink-900 dark:text-ink-50">{t.title}</p>{t.mentorComment && <p className="truncate text-xs text-brand-700 dark:text-brand-300">Feedback: {t.mentorComment}</p>}</td>
                        <td className="td">{isStaff ? <span className="flex items-center gap-2"><Avatar name={t.internName} size="xs" />{t.internName}</span> : t.mentorName || '-'}</td>
                        <td className="td"><StatusBadge value={t.priority} /></td>
                        <td className="td">{fmtDate(t.dueDate)}</td>
                        <td className="td"><select aria-label={`Status of ${t.title}`} className="input !w-auto !py-1 text-xs" value={SETTABLE.includes(t.status) ? t.status : 'Pending'} onChange={(e) => changeStatus(t, e.target.value)} disabled={busyId === t.taskId}>{SETTABLE.map((s) => <option key={s}>{s}</option>)}</select>{t.status === 'Overdue' && <span className="ml-2"><StatusBadge value="Overdue" /></span>}</td>
                        {isStaff && <td className="td"><div className="flex gap-1"><IconButton icon={Pencil} label="Edit" onClick={() => setModal({ task: t })} /><IconButton icon={Trash2} label="Delete" danger onClick={() => setToDelete(t)} /></div></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

      {modal && <TaskFormModal task={modal.task} interns={interns || []} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} confirmLabel="Delete task" title="Delete task?" message={`"${toDelete?.title}" will be permanently removed for ${toDelete?.internName}.`} />
    </>
  );
}

import { useState } from 'react';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useFetch from '../hooks/useFetch';
import useForm from '../hooks/useForm';
import { evaluationsApi, internsApi } from '../services/resources';
import { PageHeader } from '../components/ui/Cards';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { Field, FormFooter, ProgressBar, SelectOptions, StarInput, inputClass } from '../components/ui/Controls';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { checkRequired } from '../utils/validators';
import { fmtDate, ratingLabel, ratingTone, todayStr } from '../utils/format';

const SKILLS = [['technicalSkills', 'Technical skills'], ['communication', 'Communication'], ['teamwork', 'Teamwork'], ['problemSolving', 'Problem solving'], ['professionalism', 'Professionalism']];

function EvaluationModal({ interns, onClose, onSaved }) {
  const toast = useToast();
  const { values, errors, setErrors, bind, set } = useForm({ internId: '', technicalSkills: 0, communication: 0, teamwork: 0, problemSolving: 0, professionalism: 0, feedback: '', evaluationDate: todayStr() });
  const [saving, setSaving] = useState(false);

  const rated = SKILLS.map(([k]) => values[k]).filter(Boolean);
  const overall = rated.length === SKILLS.length ? rated.reduce((a, b) => a + b, 0) / SKILLS.length : 0;

  const submit = async (e) => {
    e.preventDefault();
    const errs = checkRequired(values, { internId: 'Intern', feedback: 'Feedback' });
    SKILLS.forEach(([k, label]) => { if (!values[k]) errs[k] = `Please rate ${label.toLowerCase()}`; });
    if (!errs.feedback && values.feedback.trim().length < 10) errs.feedback = 'Please write at least 10 characters of feedback';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try { const res = await evaluationsApi.create(values); toast.success(res.message); onSaved(); }
    catch (err) { setErrors(err.fieldErrors || {}); toast.error(err.message); setSaving(false); }
  };

  return (
    <Modal open onClose={saving ? () => {} : onClose} title="New evaluation" subtitle="Rate each area from 1 (needs work) to 5 (excellent)."
      footer={<FormFooter formId="eval-form" saving={saving} onCancel={onClose} label="Submit evaluation" />}>
      <form id="eval-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Intern" required error={errors.internId}><select className={inputClass(errors.internId)} {...bind('internId')}><SelectOptions items={interns} valueKey="internId" labelKey="fullName" placeholder="Select intern" /></select></Field>
          <Field label="Evaluation date" error={errors.evaluationDate}><input type="date" max={todayStr()} className={inputClass(errors.evaluationDate)} {...bind('evaluationDate')} /></Field>
        </div>
        <div className="divide-y divide-ink-100 rounded-xl border border-ink-100 dark:divide-ink-800 dark:border-ink-800">
          {SKILLS.map(([key, label]) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div><span className="text-sm font-medium text-ink-800 dark:text-ink-100">{label}</span>{errors[key] && <p role="alert" className="text-xs text-rose-600">{errors[key]}</p>}</div>
              <StarInput value={values[key]} onChange={(n) => set(key, n)} error={errors[key]} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 dark:bg-ink-800/60">
          <span className="text-sm text-ink-600 dark:text-ink-300">Overall performance (calculated)</span>
          <span className="text-lg font-semibold text-ink-900 dark:text-ink-50">{overall ? `${overall.toFixed(1)} / 5` : '-'}{overall > 0 && <Badge tone={ratingTone(overall)} className="ml-2 align-middle">{ratingLabel(overall)}</Badge>}</span>
        </div>
        <Field label="Feedback" required error={errors.feedback}><textarea rows={4} className={inputClass(errors.feedback)} placeholder="Highlight strengths and what to improve next" {...bind('feedback')} /></Field>
      </form>
    </Modal>
  );
}

export default function EvaluationsPage() {
  const { user } = useAuth();
  const isStaff = user.role !== 'INTERN';
  const [internId, setInternId] = useState('');
  const [modal, setModal] = useState(false);
  const { data, loading, error, reload } = useFetch(() => evaluationsApi.list({ internId: internId || undefined }), [internId]);
  const interns = useFetch(() => (isStaff ? internsApi.list({ status: 'Active' }) : Promise.resolve([])), [isStaff]);
  const add = isStaff && <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} /> New evaluation</button>;

  return (
    <>
      <PageHeader title={isStaff ? 'Evaluations' : 'My feedback'} subtitle={isStaff ? 'Evaluate interns and review past feedback.' : 'Evaluations submitted by your mentor.'}
        actions={<>{isStaff && <select className="input !w-48" value={internId} onChange={(e) => setInternId(e.target.value)} aria-label="Filter by intern"><SelectOptions items={interns.data || []} valueKey="internId" labelKey="fullName" placeholder="All interns" /></select>}{add}</>} />
      {loading ? <div className="grid gap-4 lg:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
        : error ? <div className="card"><ErrorState error={error} onRetry={reload} /></div>
          : !data.length ? <div className="card"><EmptyState icon={ClipboardCheck} title="No evaluations yet" description={isStaff ? 'Submit the first evaluation for an intern.' : 'Your mentor has not submitted an evaluation yet.'} action={add} /></div>
            : (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.map((e) => (
                  <article key={e.evaluationId} className="card p-5">
                    <header className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3"><Avatar name={e.internName} /><div><h3 className="font-medium text-ink-900 dark:text-ink-50">{e.internName}</h3><p className="text-xs text-ink-500">By {e.mentorName} · {fmtDate(e.evaluationDate)}</p></div></div>
                      <div className="text-right"><p className="text-2xl font-semibold text-ink-900 dark:text-ink-50">{Number(e.overallRating).toFixed(1)}<span className="text-sm text-ink-400"> / 5</span></p><Badge tone={ratingTone(e.overallRating)}>{ratingLabel(e.overallRating)}</Badge></div>
                    </header>
                    <div className="mt-4 space-y-2.5">
                      {SKILLS.map(([key, label]) => (
                        <div key={key} className="grid grid-cols-[8rem_1fr_1.5rem] items-center gap-3 text-sm"><span className="text-ink-600 dark:text-ink-300">{label}</span><ProgressBar value={(e[key] / 5) * 100} tone={e[key] >= 4 ? 'green' : e[key] >= 3 ? 'blue' : 'amber'} /><span className="text-right font-medium text-ink-800 dark:text-ink-100">{e[key]}</span></div>
                      ))}
                    </div>
                    <p className="mt-4 rounded-lg bg-ink-50 p-3 text-sm leading-relaxed text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">{e.feedback}</p>
                  </article>
                ))}
              </div>
            )}
      {modal && <EvaluationModal interns={interns.data || []} onClose={() => setModal(false)} onSaved={() => { setModal(false); reload(); }} />}
    </>
  );
}

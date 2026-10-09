import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, GraduationCap, Mail, UserRound } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { attendanceApi, evaluationsApi, internsApi, tasksApi } from '../services/resources';
import { Section } from '../components/ui/Cards';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import Badge, { StatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Controls';
import Avatar from '../components/ui/Avatar';
import { fmtDate, fmtShortDate, internTitle, internshipProgress, ratingLabel, ratingTone } from '../utils/format';

const SKILLS = [['technicalSkills', 'Technical'], ['communication', 'Communication'], ['teamwork', 'Teamwork'], ['problemSolving', 'Problem solving'], ['professionalism', 'Professionalism']];
const DOT = { Present: 'bg-emerald-500', Late: 'bg-amber-500', Absent: 'bg-rose-500', Leave: 'bg-violet-500' };

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800"><Icon size={16} /></span>
      <div className="min-w-0"><p className="text-xs text-ink-500">{label}</p><p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">{value || '-'}</p></div>
    </div>
  );
}

export default function InternProfilePage({ self = false }) {
  const { user } = useAuth();
  const params = useParams();
  const internId = self ? user.internId : params.id;
  const canGoBack = !self;

  const { data, loading, error, reload } = useFetch(async () => {
    const [intern, tasks, attendance, evaluations] = await Promise.all([
      internsApi.get(internId), tasksApi.list({ internId }), attendanceApi.list({ internId }), evaluationsApi.list({ internId }),
    ]);
    return { intern, tasks, attendance, evaluations };
  }, [internId]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-44 rounded-xl" /><div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div></div>;
  if (error) return <div className="card"><ErrorState error={error} onRetry={reload} /></div>;

  const { intern, tasks, attendance, evaluations } = data;
  const progress = internshipProgress(intern.startDate, intern.endDate);
  const avg = (key) => (evaluations.length ? evaluations.reduce((s, e) => s + e[key], 0) / evaluations.length : 0);
  const radar = SKILLS.map(([key, label]) => ({ skill: label, value: Number(avg(key).toFixed(2)) }));
  const counts = attendance.reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), {});
  const rate = Number(intern.attendanceRate || 0);

  return (
    <>
      {canGoBack && <Link to="/interns" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white"><ArrowLeft size={16} /> Back to interns</Link>}

      <div className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-brand-700 to-brand-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar name={intern.fullName} src={intern.profileImage} size="xl" className="ring-4 ring-white dark:ring-ink-900" />
              <div className="pb-1">
                <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">{intern.fullName}</h1>
                <p className="text-sm text-ink-500">{internTitle(intern.degree)}</p>
              </div>
            </div>
            <StatusBadge value={intern.status} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Fact icon={Building2} label="Department" value={intern.departmentName} />
            <Fact icon={GraduationCap} label="University" value={intern.university} />
            <Fact icon={CalendarDays} label="Semester" value={intern.semester} />
            <Fact icon={UserRound} label="Mentor" value={intern.mentorName || 'Not assigned'} />
            <Fact icon={Mail} label="Email" value={intern.email} />
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-ink-500">Internship: <span className="font-medium text-ink-900 dark:text-ink-50">{fmtDate(intern.startDate)} - {fmtDate(intern.endDate)}</span></span><span className="font-medium text-ink-900 dark:text-ink-50">{progress}% elapsed</span></div>
            <ProgressBar value={progress} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="About">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[['Degree', intern.degree], ['Duration', `${intern.durationDays} days`], ['Tasks completed', `${intern.completedTasks} of ${intern.totalTasks}`], ['Overall rating', intern.performance ? `${Number(intern.performance).toFixed(1)} / 5` : 'Not evaluated']].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-ink-500">{k}</dt><dd className="mt-0.5 font-medium text-ink-900 dark:text-ink-50">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-ink-500">Task completion</span><span className="font-medium">{intern.totalTasks ? Math.round((intern.completedTasks / intern.totalTasks) * 100) : 0}%</span></div>
            <ProgressBar value={intern.totalTasks ? (intern.completedTasks / intern.totalTasks) * 100 : 0} tone="green" />
          </div>
        </Section>

        <Section title="Performance" subtitle={`Average of ${evaluations.length} evaluation${evaluations.length === 1 ? '' : 's'}`}>
          {!evaluations.length ? <EmptyState title="Not evaluated yet" description="Performance appears here after the first mentor evaluation." /> : (
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <div className="h-52 w-full sm:w-3/5">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radar} outerRadius="70%"><PolarGrid stroke="var(--grid)" /><PolarAngleAxis dataKey="skill" tick={{ fill: '#7d8da0', fontSize: 11 }} /><Radar dataKey="value" stroke="#1f9f98" fill="#1f9f98" fillOpacity={0.3} animationDuration={700} /></RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-4xl font-semibold text-ink-900 dark:text-ink-50">{Number(intern.performance).toFixed(1)}<span className="text-lg text-ink-400"> / 5</span></p>
                <Badge tone={ratingTone(intern.performance)} className="mt-2">{ratingLabel(intern.performance)}</Badge>
              </div>
            </div>
          )}
        </Section>

        <Section title="Assigned tasks" subtitle={`${tasks.length} total`} bodyClass="p-0">
          {!tasks.length ? <EmptyState title="No tasks assigned" description="Tasks assigned to this intern will appear here." /> : (
            <ul className="max-h-80 overflow-y-auto">
              {tasks.map((t) => (
                <li key={t.taskId} className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3 last:border-0 dark:border-ink-800">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">{t.title}</p><p className="text-xs text-ink-500">Due {fmtShortDate(t.dueDate)} · {t.priority} priority</p></div>
                  <StatusBadge value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Attendance" subtitle="Last 28 recorded days">
          <div className="mb-1.5 flex justify-between text-sm"><span className="text-ink-500">Attendance rate</span><span className="font-semibold text-ink-900 dark:text-ink-50">{rate.toFixed(1)}%</span></div>
          <ProgressBar value={rate} tone={rate >= 85 ? 'green' : rate >= 70 ? 'amber' : 'red'} />
          {!attendance.length ? <p className="mt-4 text-sm text-ink-500">No attendance has been recorded yet.</p> : (
            <>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[...attendance].slice(0, 28).reverse().map((a) => <span key={a.attendanceId} title={`${fmtDate(a.attendanceDate)}: ${a.status}`} className={`h-5 w-5 rounded ${DOT[a.status]}`} />)}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-500">
                {['Present', 'Late', 'Absent', 'Leave'].map((s) => <span key={s} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${DOT[s]}`} />{s}: {counts[s] || 0}</span>)}
              </div>
            </>
          )}
        </Section>

        <Section title="Mentor feedback" className="lg:col-span-2" bodyClass="p-0">
          {!evaluations.length ? <EmptyState title="No feedback yet" description="Mentor feedback will appear here after an evaluation." /> : (
            <ul>
              {evaluations.map((e) => (
                <li key={e.evaluationId} className="flex gap-4 border-b border-ink-100 px-5 py-4 last:border-0 dark:border-ink-800">
                  <Avatar name={e.mentorName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-sm font-medium text-ink-900 dark:text-ink-50">{e.mentorName}</p><span className="text-xs text-ink-500">{fmtDate(e.evaluationDate)}</span><Badge tone={ratingTone(e.overallRating)}>{Number(e.overallRating).toFixed(1)} · {ratingLabel(e.overallRating)}</Badge></div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{e.feedback}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}

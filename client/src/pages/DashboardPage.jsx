import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, CheckCircle2, ClipboardCheck, ClipboardList, GraduationCap, Medal, Star, UserCheck, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { dashboardApi, internsApi, tasksApi } from '../services/resources';
import { Section, StatCard } from '../components/ui/Cards';
import PhotoBackdrop, { IMAGES } from '../components/ui/PhotoBackdrop';
import { CardGridSkeleton, EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { StatusBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { AttendanceChart, InternsByDepartmentChart, PerformanceChart, TaskStatusChart } from '../components/charts/Charts';
import { fmtDate, firstName, greeting, ratingLabel } from '../utils/format';

function statCards(role, s) {
  const rating = s.averagePerformance ? `${Number(s.averagePerformance).toFixed(1)} / 5` : 'No ratings';
  const perf = { icon: Star, label: 'Average performance', value: rating, hint: s.averagePerformance ? ratingLabel(s.averagePerformance) : 'No evaluations yet', tone: 'violet' };
  const att = { icon: CalendarCheck, label: 'Attendance rate', value: `${Number(s.attendanceRate || 0).toFixed(1)}%`, hint: 'Present or late days', tone: 'teal' };
  const open = { icon: ClipboardList, label: 'Pending tasks', value: s.pendingTasks, hint: `${s.overdueTasks} overdue`, tone: 'amber' };
  const done = { icon: CheckCircle2, label: 'Completed tasks', value: s.completedTasks, hint: 'Marked as completed', tone: 'green' };
  if (role === 'INTERN') return [open, done, { icon: AlertTriangle, label: 'Overdue tasks', value: s.overdueTasks, hint: 'Past their due date', tone: 'red' }, att, perf];
  const base = [
    { icon: GraduationCap, label: role === 'MENTOR' ? 'My interns' : 'Total interns', value: s.totalInterns, hint: 'Across all statuses', tone: 'brand' },
    { icon: UserCheck, label: 'Active interns', value: s.activeInterns, hint: 'Currently in programme', tone: 'teal' },
  ];
  if (role === 'ADMIN') base.push({ icon: Medal, label: 'Completed internships', value: s.completedInternships, hint: 'Finished the programme', tone: 'violet' }, { icon: Users, label: 'Total mentors', value: s.totalMentors, hint: 'Active mentors', tone: 'blue' });
  return [...base, open, done, perf, att];
}

const LINKS = {
  ADMIN: [['/interns', 'Manage interns'], ['/tasks', 'Assign a task']],
  MENTOR: [['/evaluations', 'Evaluate interns'], ['/attendance', 'Mark attendance']],
  INTERN: [['/tasks', 'View my tasks'], ['/profile', 'My profile']],
};

function WelcomeBanner({ user }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const subtitle = user.role === 'ADMIN' ? 'Track your internship programme and team progress.' : user.role === 'MENTOR' ? 'Keep an eye on your interns, their tasks and their progress.' : 'Your tasks, attendance and mentor feedback at a glance.';
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 p-6 text-white shadow-lift sm:p-8">
      <PhotoBackdrop src={IMAGES.team} />
      <div className="relative max-w-xl">
        <p className="text-sm text-indigo-100">{today}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{greeting()}, {firstName(user.fullName)}</h1>
        <p className="mt-2 text-indigo-100">{subtitle}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {LINKS[user.role].map(([to, label]) => (
            <Link key={to} to={to} className="rounded-lg bg-white/15 px-3.5 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25 active:scale-[.98]">{label}</Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Programme overview: every number comes from the dashboard stats API
function ProgrammeCard({ stats, isIntern }) {
  const total = stats.pendingTasks + stats.completedTasks;
  const pct = total ? Math.round((stats.completedTasks / total) * 100) : 0;
  const steps = [
    { icon: UserPlus, label: 'Onboarding', value: isIntern ? 'Welcome to the programme' : `${stats.activeInterns} active intern${stats.activeInterns === 1 ? '' : 's'}` },
    { icon: ClipboardCheck, label: 'Delivery', value: `${stats.completedTasks} of ${total} tasks completed (${pct}%)` },
    { icon: Star, label: 'Reviews', value: stats.averagePerformance ? `Average rating ${Number(stats.averagePerformance).toFixed(1)} / 5` : 'No evaluations yet' },
    ...(isIntern ? [] : [{ icon: Medal, label: 'Completion', value: `${stats.completedInternships} internship${stats.completedInternships === 1 ? '' : 's'} finished` }]),
  ];
  return (
    <section className="card overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-teal-500 via-brand-600 to-violet-600">
        <PhotoBackdrop src={IMAGES.meeting} alt="Interns and mentors in a team meeting" variant="cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
        <h2 className="absolute bottom-3 left-5 text-lg font-semibold !text-white">Internship programme</h2>
      </div>
      <ul className="space-y-4 p-5">
        {steps.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><Icon size={17} /></span>
            <div className="min-w-0"><p className="text-sm font-medium text-ink-900 dark:text-ink-50">{label}</p><p className="truncate text-xs text-ink-500">{value}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UpcomingTasks({ showIntern }) {
  const { data, loading, error, reload } = useFetch(() => tasksApi.list(), []);
  const upcoming = (data || []).filter((t) => t.status !== 'Completed').slice(0, 5);
  return (
    <Section title="Upcoming deadlines" subtitle="Open tasks ordered by due date" bodyClass="p-0"
      actions={<Link to="/tasks" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>}>
      {loading ? <div className="space-y-3 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        : error ? <ErrorState error={error} onRetry={reload} />
          : !upcoming.length ? <EmptyState icon={CheckCircle2} title="Nothing due" description="All tasks are completed. Nice work." />
            : (
              <ul>
                {upcoming.map((t) => (
                  <li key={t.taskId} className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3 last:border-0 dark:border-ink-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">{t.title}</p>
                      <p className="text-xs text-ink-500">{showIntern ? `${t.internName} · ` : ''}Due {fmtDate(t.dueDate)}</p>
                    </div>
                    <StatusBadge value={t.status} />
                  </li>
                ))}
              </ul>
            )}
    </Section>
  );
}

function MyMentorCard({ internId }) {
  const { data, loading } = useFetch(() => internsApi.get(internId), [internId]);
  return (
    <Section title="My mentor" bodyClass="p-5">
      {loading ? <Skeleton className="h-16" /> : data?.mentorName ? (
        <div className="flex items-center gap-4">
          <Avatar name={data.mentorName} size="lg" />
          <div className="min-w-0">
            <p className="font-medium text-ink-900 dark:text-ink-50">{data.mentorName}</p>
            <p className="text-sm text-ink-500">{data.mentorPosition}</p>
            <p className="truncate text-sm text-brand-600">{data.mentorEmail}</p>
          </div>
        </div>
      ) : <p className="text-sm text-ink-500">A mentor has not been assigned to you yet.</p>}
    </Section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const stats = useFetch(() => dashboardApi.stats(), []);
  const charts = useFetch(() => dashboardApi.charts(), []);
  const isIntern = user.role === 'INTERN';

  return (
    <>
      <WelcomeBanner user={user} />

      {stats.loading ? <CardGridSkeleton count={isIntern ? 5 : 8} />
        : stats.error ? <div className="card"><ErrorState error={stats.error} onRetry={stats.reload} /></div>
          : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards(user.role, stats.data).map((c) => <StatCard key={c.label} {...c} />)}
            </div>
          )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {charts.loading ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)
          : charts.error ? <div className="card lg:col-span-2"><ErrorState error={charts.error} onRetry={charts.reload} /></div>
            : (
              <>
                {!isIntern && <InternsByDepartmentChart data={charts.data.internsByDepartment} />}
                <TaskStatusChart data={charts.data.taskStatus} />
                <AttendanceChart data={charts.data.attendanceOverview} />
                <PerformanceChart data={charts.data.performanceOverview} byDate={isIntern} />
              </>
            )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3"><UpcomingTasks showIntern={!isIntern} /></div>
        <div className="space-y-4 lg:col-span-2">
          {stats.data && <ProgrammeCard stats={stats.data} isIntern={isIntern} />}
          {isIntern && user.internId && <MyMentorCard internId={user.internId} />}
        </div>
      </div>
    </>
  );
}
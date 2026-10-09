import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, GraduationCap, Mail, Star } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { mentorsApi } from '../services/resources';
import { Section, StatCard } from '../components/ui/Cards';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { StatusBadge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

export default function MentorProfilePage() {
  const { id } = useParams();
  const { data: mentor, loading, error, reload } = useFetch(() => mentorsApi.get(id), [id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (error) return <div className="card"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <>
      <Link to="/mentors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white"><ArrowLeft size={16} /> Back to mentors</Link>
      <div className="card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={mentor.fullName} size="xl" />
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">{mentor.fullName}</h1>
          <p className="text-sm text-ink-500">{mentor.position} · {mentor.departmentName}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-600"><Mail size={14} /> {mentor.email}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={GraduationCap} label="Assigned interns" value={mentor.internCount} tone="brand" />
        <StatCard icon={ClipboardList} label="Tasks assigned" value={mentor.taskCount} tone="amber" />
        <StatCard icon={Star} label="Intern performance" value={mentor.performance ? `${Number(mentor.performance).toFixed(1)} / 5` : 'No ratings'} tone="violet" />
      </div>
      <Section title="Assigned interns" className="mt-4" bodyClass="p-0">
        {!mentor.interns.length ? <EmptyState icon={GraduationCap} title="No interns assigned" description="Assign this mentor from the intern's edit form." /> : (
          <div className="overflow-x-auto"><table className="table">
            <thead><tr>{['Intern', 'Department', 'Status', 'Performance'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{mentor.interns.map((i) => (
              <tr key={i.internId} className="tr-hover">
                <td className="td"><div className="flex items-center gap-3"><Avatar name={i.fullName} size="sm" /><Link to={`/interns/${i.internId}`} className="font-medium hover:text-brand-600">{i.fullName}</Link></div></td>
                <td className="td">{i.departmentName}</td>
                <td className="td"><StatusBadge value={i.status} /></td>
                <td className="td">{i.performance ? `${Number(i.performance).toFixed(1)} / 5` : '-'}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Section>
    </>
  );
}

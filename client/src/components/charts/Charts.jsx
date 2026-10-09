import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '../ui/Feedback';
import { BarChart3 } from 'lucide-react';
import { fmtShortDate } from '../../utils/format';

const PALETTE = ['#1f9f98', '#4f6bed', '#e9a23b', '#d64550', '#8b5cf6', '#38bdf8', '#64748b'];
const STATUS_COLORS = { Pending: '#94a3b8', 'In Progress': '#4f6bed', Completed: '#1f9f98', Overdue: '#d64550' };
const axis = { fill: '#7d8da0', fontSize: 12 };
const tooltipStyle = { background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,.12)' };

function ChartFrame({ title, subtitle, empty, children }) {
  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      <p className="mb-4 text-xs text-ink-500">{subtitle}</p>
      {empty ? <EmptyState icon={BarChart3} title="No data yet" description="This chart will fill in as records are added." /> : <div className="h-64">{children}</div>}
    </div>
  );
}

export function InternsByDepartmentChart({ data = [] }) {
  return (
    <ChartFrame title="Interns by department" subtitle="Number of interns in each team" empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 8, top: 4 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} tickFormatter={(v) => (v.length > 11 ? `${v.slice(0, 10)}…` : v)} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(125,141,160,.1)' }} />
          <Bar dataKey="value" name="Interns" radius={[6, 6, 0, 0]} animationDuration={700}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function TaskStatusChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <ChartFrame title="Task status" subtitle={`${total} tasks in total`} empty={!total}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={3} stroke="none" animationDuration={700}>
            {data.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function AttendanceChart({ data = [] }) {
  return (
    <ChartFrame title="Attendance overview" subtitle="Daily attendance over the last three weeks" empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -20, right: 8, top: 4 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="attendanceDate" tick={axis} tickLine={false} axisLine={false} tickFormatter={fmtShortDate} minTickGap={16} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtShortDate} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="present" name="Present" stroke="#1f9f98" strokeWidth={2.5} dot={false} animationDuration={700} />
          <Line type="monotone" dataKey="late" name="Late" stroke="#e9a23b" strokeWidth={2} dot={false} animationDuration={700} />
          <Line type="monotone" dataKey="absent" name="Absent" stroke="#d64550" strokeWidth={2} dot={false} animationDuration={700} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function PerformanceChart({ data = [], byDate = false }) {
  const rows = data.map((d) => ({ ...d, label: byDate ? fmtShortDate(d.name) : d.name.split(' ')[0] }));
  return (
    <ChartFrame title="Performance overview" subtitle={byDate ? 'Your overall rating per evaluation' : 'Average evaluation rating (out of 5)'} empty={!rows.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: -20, right: 8, top: 4 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval={0} />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(125,141,160,.1)' }} formatter={(v) => [`${v} / 5`, 'Rating']} labelFormatter={(_, p) => p?.[0]?.payload?.name} />
          <Bar dataKey="rating" name="Rating" fill="#4f6bed" radius={[6, 6, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

// Stacked monthly attendance (used on the Attendance page and profile)
export function MonthlyAttendanceChart({ data = [], fmt }) {
  return (
    <ChartFrame title="Monthly attendance" subtitle="Days by attendance status" empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 8, top: 4 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="month" tick={axis} tickLine={false} axisLine={false} tickFormatter={fmt} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(125,141,160,.1)' }} labelFormatter={fmt} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="present" name="Present" stackId="a" fill="#1f9f98" animationDuration={700} />
          <Bar dataKey="late" name="Late" stackId="a" fill="#e9a23b" animationDuration={700} />
          <Bar dataKey="absent" name="Absent" stackId="a" fill="#d64550" animationDuration={700} />
          <Bar dataKey="onLeave" name="Leave" stackId="a" fill="#8b5cf6" radius={[6, 6, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

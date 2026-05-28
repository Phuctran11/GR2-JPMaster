import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ReactNode } from 'react';
import type { AdminRole, AdminStats } from '../../../services/api';
import { formatVnd } from '../../course';
import { StatTile } from '../DashboardUi';

const quizTypeLabels: Record<string, string> = {
  lesson_quiz: 'Lesson quizzes',
  practice_test: 'Practice tests',
  final_test: 'Final tests',
};

const paymentStatusLabels: Record<string, string> = {
  paid: 'Paid',
  failed: 'Failed',
  canceled: 'Canceled',
  expired: 'Expired',
};

const chartColors = {
  navy: 'rgb(var(--color-primary))',
  coral: 'rgb(var(--color-tertiary))',
  amber: 'rgb(var(--color-warning))',
  teal: 'rgb(var(--color-success))',
  violet: 'rgb(var(--color-inverse-primary))',
  emerald: 'rgb(var(--color-success))',
  sky: 'rgb(var(--color-surface-tint))',
  rose: 'rgb(var(--color-error))',
  softBlue: 'rgb(var(--color-primary-fixed))',
  softAmber: 'rgb(var(--color-warning-container))',
};

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const compactVnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatDateLabel = (value: string) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

const chartCardClass = 'rounded-lg border border-outline-variant bg-surface p-5 shadow-sm transition-shadow hover:shadow-md';
const chartTitleClass = 'text-headline-sm font-semibold text-on-surface';
const chartSubtitleClass = 'mt-1 text-body-sm leading-6 text-on-surface-variant';
const chartContainerClass = 'h-72 min-h-72';
const largeChartContainerClass = 'h-80 min-h-80';
const gridStroke = 'rgb(var(--color-outline-variant))';
const axisTickStyle = { fill: 'rgb(var(--color-on-surface-variant))', fontSize: 12 };
const tooltipStyle = {
  border: '1px solid rgb(var(--color-outline-variant))',
  borderRadius: 8,
  backgroundColor: 'rgb(var(--color-surface))',
  color: 'rgb(var(--color-on-surface))',
  boxShadow: '0 12px 28px rgb(26 27 33 / 0.12)',
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className={chartCardClass}>
      <div className="mb-5 flex flex-col gap-1">
        <h2 className={chartTitleClass}>{title}</h2>
        {subtitle && <p className={chartSubtitleClass}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyChart({ label = 'No data yet.' }: { label?: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-4 text-center text-body-sm text-on-surface-variant">
      {label}
    </div>
  );
}

function hasValues(rows: Array<Record<string, unknown>>, keys: string[]) {
  return rows.some((row) => keys.some((key) => Number(row[key] ?? 0) > 0));
}

export function OverviewSection({ stats, role }: { stats: AdminStats; role: AdminRole }) {
  const assessmentRows = [
    ...stats.testsByType.map((item) => ({
      name: quizTypeLabels[item.quiz_type || ''] ?? 'Uncategorized',
      count: item.count,
    })),
    { name: 'JLPT tests', count: stats.totals.jlptTests },
  ].filter((row) => row.count > 0);

  const learningRows = [
    { name: 'Enrollments', count: stats.totals.enrollments, fill: chartColors.teal },
    { name: 'Quiz attempts', count: stats.totals.quizAttempts, fill: chartColors.violet },
    { name: 'JLPT attempts', count: stats.totals.jlptAttempts, fill: chartColors.coral },
  ];

  const jlptLevelRows = stats.jlptByLevel.map((item) => ({
    name: item.jlpt_level || 'Uncategorized',
    count: item.count,
  }));

  const paymentOutcomeRows = stats.paymentsByStatus
    .filter((item) => item.status !== 'pending')
    .map((item) => ({
      name: paymentStatusLabels[item.status] ?? item.status,
      count: item.count,
      amount: item.amount,
    }));

  const revenueRows = stats.revenueByDay.map((item) => ({
    date: formatDateLabel(item.revenue_date),
    revenue: item.revenue,
    paidCount: item.paid_count,
  }));

  const activityRows = stats.activityByDay.map((item) => ({
    date: formatDateLabel(item.activity_date),
    enrollments: item.enrollments,
    quizAttempts: item.quiz_attempts,
    jlptAttempts: item.jlpt_attempts,
    newUsers: item.new_users,
  }));

  return (
    <section className="space-y-6">
      <div className={`grid grid-cols-1 gap-4 ${role === 'admin' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        {role === 'admin' && <StatTile label="Users" value={stats.totals.users} icon="group" />}
        <StatTile label="Courses" value={stats.totals.courses} icon="school" />
        <StatTile label="Lessons" value={stats.totals.lessons} icon="menu_book" />
        <StatTile label="Course Tests" value={stats.totals.tests} icon="quiz" />
        <StatTile label="JLPT Tests" value={stats.totals.jlptTests} icon="language" />
        <StatTile label="Enrollments" value={stats.totals.enrollments} icon="how_to_reg" />
        <StatTile label="Blogs" value={stats.totals.blogs} icon="article" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatTile label="Paid Payments" value={stats.totals.paidPayments} icon="payments" />
        <StatTile label="Revenue Total" value={formatVnd(stats.totals.revenueTotal)} icon="account_balance_wallet" />
        <StatTile label="Revenue 30 Days" value={formatVnd(stats.totals.revenueLast30Days)} icon="trending_up" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        {/* Chart: Learning Growth - combined chart for enrollments and learning attempts over time. */}
        <ChartCard title="Learning Growth" subtitle="Enrollments as columns, quiz/JLPT attempts as trend lines.">
          {hasValues(activityRows, ['enrollments', 'quizAttempts', 'jlptAttempts', 'newUsers']) ? (
            <div className={largeChartContainerClass}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activityRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axisTickStyle} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTickStyle} tickFormatter={(value) => compactNumber.format(Number(value))} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [compactNumber.format(Number(value)), String(name)]} />
                  <Legend />
                  <Bar dataKey="enrollments" name="Enrollments" fill={chartColors.teal} radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="quizAttempts" name="Quiz attempts" stroke={chartColors.violet} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="jlptAttempts" name="JLPT attempts" stroke={chartColors.coral} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  {role === 'admin' && <Line type="monotone" dataKey="newUsers" name="New users" stroke={chartColors.amber} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Chart: Payment Outcomes - donut chart for completed/failed/canceled/expired payments. Pending is hidden intentionally. */}
        <ChartCard title="Payment Outcomes" subtitle="Pending transactions are intentionally hidden from overview.">
          {paymentOutcomeRows.length > 0 ? (
            <div className={largeChartContainerClass}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentOutcomeRows}
                    dataKey="count"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {paymentOutcomeRows.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={[chartColors.emerald, chartColors.rose, chartColors.amber, chartColors.sky][index % 4]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name, props) => [`${value} payments - ${formatVnd(Number(props.payload.amount))}`, String(name)]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="No completed payment outcomes yet." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Chart: Revenue Trend - area chart for paid revenue growth in the recent period. */}
        <ChartCard title="Revenue Trend" subtitle="Paid payment revenue over the last 14 days.">
          {hasValues(revenueRows, ['revenue']) ? (
            <div className={chartContainerClass}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueRows} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRevenueGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.emerald} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartColors.emerald} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axisTickStyle} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTickStyle} tickFormatter={(value) => compactVnd.format(Number(value))} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [name === 'Revenue' ? formatVnd(Number(value)) : value, String(name)]} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={chartColors.emerald} strokeWidth={3} fill="url(#adminRevenueGradient)" activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="No paid revenue in the last 14 days." />
          )}
        </ChartCard>

        {/* Chart: Learning Activity Mix - bar chart for total enrollments and attempts. */}
        <ChartCard title="Learning Activity Mix" subtitle="Total learning events by category.">
          <div className={chartContainerClass}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={learningRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTickStyle} />
                <YAxis tickLine={false} axisLine={false} tick={axisTickStyle} tickFormatter={(value) => compactNumber.format(Number(value))} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [compactNumber.format(Number(value)), 'Count']} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {learningRows.map((row) => <Cell key={row.name} fill={row.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Chart: Assessment Inventory - horizontal bar chart comparing test inventory types. */}
        <ChartCard title="Assessment Inventory" subtitle="Course tests compared with standalone JLPT tests.">
          {assessmentRows.length > 0 ? (
            <div className={chartContainerClass}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assessmentRows} layout="vertical" margin={{ top: 8, right: 16, left: 18, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={axisTickStyle} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={axisTickStyle} width={110} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [compactNumber.format(Number(value)), 'Tests']} />
                  <Bar dataKey="count" fill={chartColors.navy} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Chart: JLPT Tests by Level - vertical bar chart for JLPT inventory distribution. */}
        <ChartCard title="JLPT Tests by Level" subtitle="Distribution of JLPT test inventory.">
          {jlptLevelRows.length > 0 ? (
            <div className={chartContainerClass}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jlptLevelRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTickStyle} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTickStyle} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [compactNumber.format(Number(value)), 'JLPT tests']} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {jlptLevelRows.map((row, index) => (
                      <Cell key={row.name} fill={[chartColors.sky, chartColors.teal, chartColors.violet, chartColors.coral, chartColors.amber][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>
    </section>
  );
}

import { useStats } from '../hooks';
import { StatCard, FullPageLoader } from '../components/ui';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import s from './DashboardPage.module.css';

const PIE_COLORS  = ['#059669', '#dc2626', '#f59e0b', '#94a3b8'];
const STAT_COLORS = ['#3b82f6', '#059669', '#dc2626', '#8b5cf6'];

export const DashboardPage = () => {
  const { stats, isLoading } = useStats();

  if (isLoading) return <FullPageLoader />;
  if (!stats)    return null;

  const pieData = [
    { name: 'מגיע',     value: stats.yes     },
    { name: 'לא מגיע', value: stats.no      },
    { name: 'אולי',     value: stats.maybe   },
    { name: 'ממתין',    value: stats.pending },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'מגיע',     value: stats.yes,     fill: '#059669' },
    { name: 'לא מגיע', value: stats.no,      fill: '#dc2626' },
    { name: 'אולי',     value: stats.maybe,   fill: '#f59e0b' },
    { name: 'ממתין',    value: stats.pending, fill: '#94a3b8' },
  ];

  const attendPct = stats.total > 0
    ? Math.round((stats.yes / stats.total) * 100)
    : 0;

  return (
    <div className={s.page}>
      <hgroup className={s.heading}>
        <h1 className={s.title}>לוח בקרה</h1>
        <p className={s.subtitle}>סקירה כללית של ההזמנות</p>
      </hgroup>

      {/* Stats */}
      <section aria-label="סטטיסטיקות" className={s.statsGrid}>
        <StatCard
          title="סה״כ מוזמנים"
          value={stats.total}
          icon="👥"
          accentColor={STAT_COLORS[0]}
          subtitle={`${stats.messageSent} הודעות נשלחו`}
        />
        <StatCard
          title="מגיעים"
          value={stats.yes}
          icon="✅"
          accentColor={STAT_COLORS[1]}
          subtitle={`${attendPct}% מהמוזמנים`}
        />
        <StatCard
          title="לא מגיעים"
          value={stats.no}
          icon="❌"
          accentColor={STAT_COLORS[2]}
        />
        <StatCard
          title="שיעור מענה"
          value={`${stats.responseRate}%`}
          icon="📊"
          accentColor={STAT_COLORS[3]}
          subtitle={`${stats.maybe} אולי`}
        />
      </section>

      {/* Charts */}
      <section aria-label="גרפים" className={s.chartsGrid}>
        <article className={s.chartCard}>
          <h2 className={s.chartTitle}>התפלגות תשובות</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className={s.chartEmpty}>אין נתונים להצגה עדיין</p>
          )}
        </article>

        <article className={s.chartCard}>
          <h2 className={s.chartTitle}>סיכום תשובות</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontFamily: 'Inter' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      {/* Progress */}
      <section aria-label="התקדמות" className={s.progressCard}>
        <div className={s.progressHeader}>
          <h2 className={s.progressTitle}>התקדמות מענה</h2>
          <span className={s.progressPct}>{stats.responseRate}%</span>
        </div>
        <div className={s.progressTrack} role="progressbar"
          aria-valuenow={stats.responseRate} aria-valuemin={0} aria-valuemax={100}>
          <div className={s.progressFill} style={{ width: `${stats.responseRate}%` }} />
        </div>
        <p className={s.progressSub}>
          {stats.yes + stats.no + stats.maybe} מתוך {stats.total} ענו
        </p>
      </section>
    </div>
  );
};

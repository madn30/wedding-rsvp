import { useStats } from '../hooks';
import { StatCard, FullPageLoader } from '../components/ui';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#94a3b8'];

export const DashboardPage = () => {
  const { stats, isLoading } = useStats();

  if (isLoading) return <FullPageLoader />;
  if (!stats) return null;

  const pieData = [
    { name: 'מגיע', value: stats.yes },
    { name: 'לא מגיע', value: stats.no },
    { name: 'אולי', value: stats.maybe },
    { name: 'ממתין', value: stats.pending },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: 'מגיע', value: stats.yes, fill: '#10b981' },
    { name: 'לא מגיע', value: stats.no, fill: '#f43f5e' },
    { name: 'אולי', value: stats.maybe, fill: '#f59e0b' },
    { name: 'ממתין', value: stats.pending, fill: '#94a3b8' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold text-gray-800">לוח בקרה</h1>
        <p className="text-gray-500 mt-1">סקירה כללית של ההזמנות</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="סה״כ מוזמנים"
          value={stats.total}
          icon="👥"
          color="border-blue-400"
          subtitle={`${stats.messageSent} הודעות נשלחו`}
        />
        <StatCard
          title="מגיעים"
          value={stats.yes}
          icon="✅"
          color="border-emerald-400"
          subtitle={`${stats.total > 0 ? Math.round((stats.yes / stats.total) * 100) : 0}% מהמוזמנים`}
        />
        <StatCard
          title="לא מגיעים"
          value={stats.no}
          icon="❌"
          color="border-red-400"
        />
        <StatCard
          title="שיעור מענה"
          value={`${stats.responseRate}%`}
          icon="📊"
          color="border-purple-400"
          subtitle={`${stats.maybe} אולי`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="glass-card p-6">
          <h2 className="font-serif text-xl font-semibold text-gray-700 mb-4">
            התפלגות תשובות
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              אין נתונים להצגה עדיין
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="font-serif text-xl font-semibold text-gray-700 mb-4">
            סיכום תשובות
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-serif text-xl font-semibold text-gray-700">
            התקדמות מענה
          </h2>
          <span className="text-rose-500 font-bold">{stats.responseRate}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${stats.responseRate}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {stats.yes + stats.no + stats.maybe} מתוך {stats.total} ענו
        </p>
      </div>
    </div>
  );
};

import { useStats } from "../hooks";
import { FullPageLoader } from "../components/ui";
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
} from "recharts";

const CHART_COLORS = ["#c9a84c", "#e74c3c", "#9b59b6", "#475569"];

export const DashboardPage = () => {
  const { stats, isLoading } = useStats();

  if (isLoading) return <FullPageLoader />;
  if (!stats) return null;

  const pieData = [
    { name: "מגיע", value: stats.yes },
    { name: "לא מגיע", value: stats.no },
    { name: "אולי", value: stats.maybe },
    { name: "ממתין", value: stats.pending },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "מגיע", value: stats.yes, fill: CHART_COLORS[0] },
    { name: "לא מגיע", value: stats.no, fill: CHART_COLORS[1] },
    { name: "אולי", value: stats.maybe, fill: CHART_COLORS[2] },
    { name: "ממתין", value: stats.pending, fill: CHART_COLORS[3] },
  ];

  const getStatusColor = (name: string) => {
    switch (name) {
      case "מגיע":
        return "#c9a84c";
      case "לא מגיע":
        return "#e74c3c";
      case "אולי":
        return "#9b59b6";
      case "ממתין":
        return "#475569";
      default:
        return "#ffffff";
    }
  };

  const attendPct =
    stats.total > 0 ? Math.round((stats.yes / stats.total) * 100) : 0;

  const cardStyles =
    "bg-[#0d1b2a]/90 border border-[#c9a84c]/15 rounded-2xl shadow-2xl p-6 backdrop-blur-md";

  const ThemeStatCard = ({ title, value, icon, subtitle, color }: any) => (
    <div
      className={`${cardStyles} flex flex-col items-center sm:items-start text-center sm:text-right group hover:border-[#c9a84c]/40 transition-colors duration-300`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{
            backgroundColor: `${color}15`,
            color: color,
            border: `1px solid ${color}30`,
          }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white/60">{title}</h3>
      </div>
      <div className="text-3xl font-serif text-[#faf6ef] font-bold mb-1">
        {value}
      </div>
      {subtitle && (
        <p className="text-[11px] text-[#c9a84c]/80 uppercase tracking-wider">
          {subtitle}
        </p>
      )}
    </div>
  );

  const tooltipStyle = {
    backgroundColor: "#0d1b2a",
    border: "1px solid rgba(201, 168, 76, 0.3)",
    borderRadius: "12px",
    color: "#faf6ef",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
  };

  return (
    <div
      dir="rtl"
      className="p-4 md:p-8 w-full max-w-[1600px] mx-auto bg-[#111827] min-h-screen text-white font-sans flex flex-col gap-8 animate-in fade-in duration-500"
    >
      <header className="text-center md:text-right mb-2">
        <h1 className="text-3xl lg:text-4xl font-serif text-[#faf6ef]">
          לוח בקרה{" "}
          <em className="text-[#c9a84c] font-serif italic">וסטטיסטיקות</em>
        </h1>
        <p className="font-sans text-sm text-white/50 mt-2">
          סקירה כללית של מצב ההזמנות בזמן אמת
        </p>
      </header>

      {}
      <section
        aria-label="סטטיסטיקות"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <ThemeStatCard
          title="סה״כ מוזמנים"
          value={stats.total}
          icon="👥"
          color="#4a90e2"
          subtitle={`${stats.messageSent} הודעות נשלחו`}
        />

        <ThemeStatCard
          title="מגיעים"
          value={stats.yes}
          icon="🥂"
          color="#c9a84c"
          subtitle={`${attendPct}% מהמוזמנים`}
        />

        <ThemeStatCard
          title="לא מגיעים"
          value={stats.no}
          icon="🤍"
          color="#e74c3c"
        />

        <ThemeStatCard
          title="שיעור מענה"
          value={`${stats.responseRate}%`}
          icon="📊"
          color="#2ecc71"
          subtitle={`${stats.maybe} אולי`}
        />
      </section>

      <section
        aria-label="גרפים"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <article className={cardStyles}>
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
            <h2 className="text-lg font-serif text-[#e8c97e]">
              התפלגות תשובות
            </h2>
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
              Live Data
            </span>
          </div>

          {pieData.length > 0 ? (
            <div className="h-[320px] w-full relative">
              {}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
                style={{ marginTop: "-25px" }}
              >
                <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] mb-1">
                  סה"כ
                </span>
                <span className="text-4xl font-serif font-bold text-[#faf6ef] leading-none drop-shadow-md">
                  {pieData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
                <span className="text-[#c9a84c] text-[11px] font-medium mt-1 tracking-wide opacity-80">
                  אורחים
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                    startAngle={90}
                    endAngle={450}
                    animationBegin={200}
                    animationDuration={1000}
                    label={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={getStatusColor(entry.name)}
                        className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: "#faf6ef", fontSize: "12px" }}
                    cursor={{ fill: "transparent" }}
                  />

                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-white/60 text-[11px] font-medium px-2 hover:text-[#c9a84c] transition-colors uppercase tracking-wider">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[260px] opacity-20">
              <div className="w-16 h-16 border border-dashed border-white/20 rounded-full mb-4" />
              <p className="text-sm italic">אין נתונים להצגה</p>
            </div>
          )}
        </article>
        <article className={cardStyles}>
          <h2 className="text-lg font-serif text-[#e8c97e] border-b border-white/5 pb-4 mb-4">
            סיכום תשובות
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart
                data={barData}
                barSize={40}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />

                {}
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#faf6ef" }}
                />

                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={getStatusColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
      {}
      <section aria-label="התקדמות" className={cardStyles}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-serif text-[#e8c97e]">
            התקדמות מענה מצטברת
          </h2>
          <span className="font-sans text-2xl font-bold text-[#c9a84c] bg-[#c9a84c]/10 px-3 py-1 rounded-lg border border-[#c9a84c]/20">
            {stats.responseRate}%
          </span>
        </div>
        <div
          className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner"
          role="progressbar"
          aria-valuenow={stats.responseRate}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-l from-[#c9a84c] via-[#e8c97e] to-[#c9a84c] rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${stats.responseRate}%` }}
          >
            {}
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        <p className="text-sm text-white/40 mt-4 text-center">
          <strong className="text-white/80">
            {stats.yes + stats.no + stats.maybe}
          </strong>{" "}
          מתוך <strong className="text-white/80">{stats.total}</strong> ענו
        </p>
      </section>
    </div>
  );
};

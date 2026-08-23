import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const TABS  = ['Revenue', 'Interviews', 'Users', 'AI Performance'];
const RANGES = [
  { label: '7 days',  value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year',  value: '1y' },
];
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const KPICard = ({ label, value, sub }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
    {sub && <p className="text-xs text-emerald-600 font-medium mt-0.5">{sub}</p>}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold text-gray-700 mb-3">{children}</h3>
);

const ChartCard = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
    <SectionTitle>{title}</SectionTitle>
    {children}
  </div>
);

const LoadingChart = () => (
  <div className="h-64 bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
    <p className="text-gray-300 text-sm">Loading chart...</p>
  </div>
);

// ─── Revenue Tab ──────────────────────────────────────────────────────────────
function RevenueTab({ range }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${serverUrl}/api/admin/analytics/revenue?range=${range}`, { withCredentials: true })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><LoadingChart /><LoadingChart /></div>;
  if (!data)   return null;

  const byPlanFormatted = (data.byPlan || []).map(p => ({
    name:    p._id || 'Unknown',
    revenue: p.revenue,
    count:   p.count,
  }));

  const summaryMap = {};
  (data.summary || []).forEach(s => { summaryMap[s._id] = s; });
  const totalRev  = data.overTime.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Total Revenue (period)" value={`₹${totalRev}`} />
        <KPICard label="Successful Payments" value={summaryMap['paid']?.count || 0} />
        <KPICard label="Failed Payments"     value={summaryMap['failed']?.count || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Over Time">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.overTime} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Plan">
          {byPlanFormatted.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-gray-300 text-sm">No plan data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byPlanFormatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Interviews Tab ───────────────────────────────────────────────────────────
function InterviewsTab({ range }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${serverUrl}/api/admin/analytics/interviews?range=${range}`, { withCredentials: true })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><LoadingChart /><LoadingChart /></div>;
  if (!data)   return null;

  const modeData = (data.byMode || []).map(m => ({ name: m._id || 'Unknown', value: m.count }));
  const statusData = (data.byStatus || []).map(s => ({
    name:  s._id || 'unknown',
    count: s.count
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Interviews Over Time">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.overTime} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="HR vs Technical">
          {modeData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-gray-300 text-sm">No mode data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={modeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {modeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Status Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Avg Score Over Time (Completed)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.avgScoreOverTime} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => v.toFixed(1)} />
              <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ range }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${serverUrl}/api/admin/analytics/users?range=${range}`, { withCredentials: true })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return <LoadingChart />;
  if (!data)   return null;

  const growthSign = data.growthPct >= 0 ? '+' : '';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="New Users Today"     value={data.todayCount} />
        <KPICard label="New Users This Week" value={data.weekCount} />
        <KPICard label="New Users This Month" value={data.monthCount} />
        <KPICard
          label="MoM Growth"
          value={`${growthSign}${data.growthPct}%`}
          sub={`vs ${data.prevMonthCount} last month`}
        />
      </div>

      <ChartCard title="New User Registrations Over Time">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.overTime} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="New Users" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── AI Performance Tab ───────────────────────────────────────────────────────
function AITab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${serverUrl}/api/admin/analytics/ai`, { withCredentials: true })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><LoadingChart /><LoadingChart /></div>;
  if (!data)   return null;

  const { overall, byDifficulty, byMode, byExperience } = data;

  const diffData = (byDifficulty || []).map(d => ({
    name:            d._id || 'unknown',
    'Avg Score':     Number((d.avgScore     || 0).toFixed(1)),
    'Confidence':    Number((d.avgConfidence || 0).toFixed(1)),
    'Communication': Number((d.avgCommunication || 0).toFixed(1)),
    'Correctness':   Number((d.avgCorrectness || 0).toFixed(1)),
  }));

  const modeData = (byMode || []).map(m => ({
    name:     m._id || 'Unknown',
    avgScore: Number((m.avgScore || 0).toFixed(1)),
    count:    m.count
  }));

  return (
    <div className="space-y-6">
      {/* NOTE: Token usage and AI cost data is NOT stored in the database.
          Only metrics derivable from the Interview collection are shown here. */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Total AI Evaluations"   value={overall.totalEvaluations} />
        <KPICard label="Avg Question Score"      value={`${overall.avgScore}/10`} />
        <KPICard label="Avg Confidence"          value={`${overall.avgConfidence}/10`} />
        <KPICard label="Avg Communication"       value={`${overall.avgCommunication}/10`} />
        <KPICard label="Avg Correctness"         value={`${overall.avgCorrectness}/10`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Performance by Difficulty">
          {diffData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={diffData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} />
                <Bar dataKey="Avg Score"     fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Confidence"    fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Communication" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Correctness"   fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Avg Score by Mode">
          {modeData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={modeData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {byExperience?.length > 0 && (
        <ChartCard title="Avg Score by Experience Level (Top 10)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={byExperience.map(e => ({ name: e._id || 'N/A', avgScore: Number((e.avgScore || 0).toFixed(1)), count: e.count }))}
              margin={{ top: 5, right: 10, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#10b981" radius={[4, 4, 0, 0]} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('Revenue');
  const [range, setRange]         = useState('30d');

  // AI tab doesn't use a range
  const showRange = activeTab !== 'AI Performance';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">All metrics aggregated server-side via MongoDB pipelines</p>
      </div>

      {/* Tab bar + range */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {showRange && (
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  range === r.value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'Revenue'        && <RevenueTab    range={range} />}
      {activeTab === 'Interviews'     && <InterviewsTab range={range} />}
      {activeTab === 'Users'          && <UsersTab      range={range} />}
      {activeTab === 'AI Performance' && <AITab />}
    </div>
  );
}

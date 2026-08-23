import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaClipboardList, FaCheckCircle, FaClock } from 'react-icons/fa';
import { MdPayments, MdTrendingUp } from 'react-icons/md';
import { BsStarFill, BsGraphUp, BsPersonPlus } from 'react-icons/bs';

// ── Reusable stat card ────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub }) => {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    teal:   'bg-teal-50 text-teal-600',
    rose:   'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color] || colorMap.blue}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 truncate">{label}</p>
        {sub && <p className="text-xs text-emerald-600 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ── Recent activity row ───────────────────────────────────────────────────────
const RecentCard = ({ title, items, renderItem, loading }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
    </div>
    <div className="divide-y divide-gray-50">
      {loading ? (
        Array(4).fill(0).map((_, i) => (
          <div key={i} className="px-5 py-3 flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-100 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="h-2.5 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))
      ) : items.length === 0 ? (
        <p className="px-5 py-6 text-center text-gray-400 text-sm">No data yet</p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="px-5 py-3 hover:bg-gray-50 transition-colors">
            {renderItem(item)}
          </div>
        ))
      )}
    </div>
  </div>
);

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, usersRes, interviewsRes, paymentsRes] = await Promise.all([
          axios.get(serverUrl + '/api/admin/dashboard', { withCredentials: true }),
          axios.get(serverUrl + '/api/admin/users?limit=5&sort=newest', { withCredentials: true }),
          axios.get(serverUrl + '/api/admin/interviews?limit=5', { withCredentials: true }),
          axios.get(serverUrl + '/api/admin/payments?limit=5&status=paid', { withCredentials: true }),
        ]);
        setStats(statsRes.data);
        setRecentUsers(usersRes.data.users || []);
        setRecentInterviews(interviewsRes.data.interviews || []);
        setRecentPayments(paymentsRes.data.payments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setActivityLoading(false);
      }
    };
    fetchAll();
  }, []);

  const kpiCards = stats ? [
    { label: 'Total Users',          value: stats.totalUsers,           icon: FaUsers,       color: 'purple' },
    { label: 'Total Interviews',      value: stats.totalInterviews,      icon: FaClipboardList,color: 'blue' },
    { label: 'Total Revenue (₹)',     value: `₹${stats.totalRevenue}`,   icon: MdPayments,    color: 'green' },
    { label: 'Avg Interview Score',   value: `${stats.avgScore}/10`,     icon: BsStarFill,    color: 'amber' },
    { label: 'Completed Interviews',  value: stats.completedInterviews,  icon: FaCheckCircle, color: 'teal', sub: `${stats.pendingInterviews} pending` },
    { label: 'AI Evaluations',        value: stats.totalEvaluations,     icon: BsGraphUp,     color: 'indigo' },
    { label: 'Interviews This Month', value: stats.interviewsThisMonth,  icon: MdTrendingUp,  color: 'blue',  sub: `${stats.interviewsToday} today` },
    { label: 'New Users This Month',  value: stats.newUsersThisMonth,    icon: BsPersonPlus,  color: 'rose',  sub: `${stats.newUsersToday} today` },
  ] : [];

  const skillCards = stats ? [
    { label: 'Avg Confidence',    value: `${stats.avgConfidence}/10`,    color: 'green' },
    { label: 'Avg Communication', value: `${stats.avgCommunication}/10`, color: 'blue' },
    { label: 'Avg Correctness',   value: `${stats.avgCorrectness}/10`,   color: 'purple' },
    { label: 'Credits Purchased', value: stats.totalCredits,             color: 'amber' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Platform Overview</h2>
        <p className="text-gray-500 text-sm mt-1">All metrics computed server-side via MongoDB aggregation</p>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((c, i) => (
            <StatCard key={i} {...c} />
          ))}
        </div>
      )}

      {/* Skill averages */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {skillCards.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentCard
          title="Recent Sign-ups"
          items={recentUsers}
          loading={activityLoading}
          renderItem={(u) => (
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/admin/users/${u._id}`)}
            >
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {u.name?.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                {new Date(u.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        />

        <RecentCard
          title="Recent Interviews"
          items={recentInterviews}
          loading={activityLoading}
          renderItem={(iv) => (
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/admin/interviews/${iv._id}`)}
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {iv.userId?.name?.slice(0, 1).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{iv.userId?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{iv.role} · {iv.mode}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                iv.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {iv.status}
              </span>
            </div>
          )}
        />

        <RecentCard
          title="Recent Payments"
          items={recentPayments}
          loading={activityLoading}
          renderItem={(p) => (
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/admin/payments')}
            >
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                ₹
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{p.userId?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{p.planId} · {p.credits} credits</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">₹{p.amount}</span>
            </div>
          )}
        />
      </div>
    </div>
  );
}

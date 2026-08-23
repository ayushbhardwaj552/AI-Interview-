import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserCircle } from 'react-icons/fa';
import { MdEmail, MdAdminPanelSettings } from 'react-icons/md';
import { BsCoin } from 'react-icons/bs';

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-gray-500 text-sm">{label}</span>
    <span className="text-gray-900 text-sm font-medium">{value}</span>
  </div>
);

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    axios.get(`${serverUrl}/api/admin/users/${id}`, { withCredentials: true })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      await axios.put(
        `${serverUrl}/api/admin/users/${id}/status`,
        {},
        { withCredentials: true }
      );
      setData(prev => ({
        ...prev,
        user: { ...prev.user, isActive: !prev.user.isActive }
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-400">User not found</div>;
  }

  const { user, stats, recentInterviews, recentPayments } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition"
        >
          <FaArrowLeft className="text-gray-600" size={14} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
        {user.role !== 'admin' && (
          <button
            disabled={toggling}
            onClick={handleToggleStatus}
            className={`ml-auto px-4 py-2 rounded-xl text-sm font-medium transition ${
              user.isActive !== false
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
            } disabled:opacity-50`}
          >
            {toggling ? 'Updating...' : user.isActive !== false ? 'Disable Account' : 'Enable Account'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                {user.name?.slice(0, 1).toUpperCase()}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
              <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {user.role}
              </span>
              <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                user.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {user.isActive !== false ? 'Active' : 'Disabled'}
              </span>
            </div>
            <InfoRow label="Email"    value={user.email} />
            <InfoRow label="Credits"  value={user.credits} />
            <InfoRow label="Joined"   value={new Date(user.createdAt).toLocaleDateString()} />
            <InfoRow label="Updated"  value={new Date(user.updatedAt).toLocaleDateString()} />
          </div>

          {/* Stats card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-semibold text-gray-800 mb-4 text-sm">Performance Stats</h4>
            <InfoRow label="Total Interviews"     value={stats.totalInterviews} />
            <InfoRow label="Completed"            value={stats.completedInterviews} />
            <InfoRow label="Avg Score"            value={`${stats.avgScore}/10`} />
            <InfoRow label="Total Spent"          value={`₹${stats.totalSpent}`} />
            <InfoRow label="Credits Purchased"    value={stats.totalCredits} />
            <InfoRow label="Successful Payments"  value={stats.totalPayments} />
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interview history */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 text-sm">Recent Interviews (last 10)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Role', 'Experience', 'Mode', 'Score', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentInterviews.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs">No interviews yet</td></tr>
                  ) : recentInterviews.map((iv) => (
                    <tr
                      key={iv._id}
                      onClick={() => navigate(`/admin/interviews/${iv._id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-800">{iv.role}</td>
                      <td className="px-5 py-3 text-gray-500">{iv.experience}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          iv.mode === 'Technical' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>{iv.mode}</span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-emerald-600">
                        {iv.finalScore ? `${iv.finalScore.toFixed(1)}/10` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          iv.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>{iv.status}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(iv.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-800 text-sm">Payment History (last 10)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Plan', 'Amount', 'Credits', 'Status', 'Order ID', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentPayments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs">No payments yet</td></tr>
                  ) : recentPayments.map((p) => (
                    <tr key={p._id}>
                      <td className="px-5 py-3 font-medium text-gray-800 capitalize">{p.planId}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-600">₹{p.amount}</td>
                      <td className="px-5 py-3 text-gray-600">{p.credits}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'paid'    ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'failed'  ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs font-mono">
                        {p.razorpayOrderId?.slice(-10) || '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

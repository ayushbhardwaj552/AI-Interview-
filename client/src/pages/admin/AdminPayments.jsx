import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdPayments } from 'react-icons/md';

const STATUS_OPTIONS = [{ label: 'All Status', value: '' }, { label: 'Paid', value: 'paid' }, { label: 'Pending', value: 'created' }, { label: 'Failed', value: 'failed' }];
const PLAN_OPTIONS   = [{ label: 'All Plans', value: '' }, { label: 'Starter (Basic)', value: 'basic' }, { label: 'Pro', value: 'pro' }];

const StatCard = ({ label, value, color = 'gray' }) => {
  const colors = {
    green:  'text-emerald-600 bg-emerald-50',
    red:    'text-red-600 bg-red-50',
    blue:   'text-blue-600 bg-blue-50',
    gray:   'text-gray-700 bg-gray-50',
    amber:  'text-amber-600 bg-amber-50',
  };
  return (
    <div className={`rounded-2xl p-5 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-70">{label}</p>
    </div>
  );
};

export default function AdminPayments() {
  const [payments, setPayments]   = useState([]);
  const [stats, setStats]         = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalPayments: 0 });
  const [status, setStatus]       = useState('');
  const [planId, setPlanId]       = useState('');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, status, planId });
      const res = await axios.get(
        `${serverUrl}/api/admin/payments?${params}`,
        { withCredentials: true }
      );
      setPayments(res.data.payments || []);
      setStats(res.data.stats || {});
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, status, planId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Payment Management</h2>
        <p className="text-gray-500 text-sm mt-1">{pagination.totalPayments} total records</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Transactions"  value={stats.total        || 0} color="blue" />
        <StatCard label="Successful"          value={stats.successful   || 0} color="green" />
        <StatCard label="Failed"              value={stats.failed       || 0} color="red" />
        <StatCard label="Total Revenue (₹)"   value={`₹${stats.totalRevenue || 0}`} color="green" />
        <StatCard label="Avg Transaction"     value={`₹${stats.avgAmount || 0}`} color="amber" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={planId}
          onChange={(e) => { setPlanId(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['User', 'Plan', 'Amount', 'Credits', 'Razorpay Order ID', 'Razorpay Payment ID', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(8).fill(0).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-3 bg-gray-100 rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">No payments found</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {p.userId?.name?.slice(0, 1).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-28">{p.userId?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-28">{p.userId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize font-medium text-gray-700">{p.planId || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-emerald-600">₹{p.amount}</td>
                    <td className="px-5 py-4 text-gray-600">{p.credits}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                      {p.razorpayOrderId ? p.razorpayOrderId.slice(-12) : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                      {p.razorpayPaymentId ? p.razorpayPaymentId.slice(-12) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.status === 'paid'    ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'failed'  ? 'bg-red-100 text-red-700' :
                                                  'bg-amber-100 text-amber-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalPayments} payments
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <FaChevronLeft size={12} />
              </button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const MODE_OPTIONS   = [{ label: 'All Modes', value: '' }, { label: 'Technical', value: 'Technical' }, { label: 'HR', value: 'HR' }];
const STATUS_OPTIONS = [{ label: 'All Status', value: '' }, { label: 'Completed', value: 'completed' }, { label: 'Pending', value: 'pending' }, { label: 'Active', value: 'active' }];

export default function AdminInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews]   = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, totalPages: 1, totalInterviews: 0 });
  const [search, setSearch]           = useState('');
  const [mode, setMode]               = useState('');
  const [status, setStatus]           = useState('');
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, search, mode, status });
      const res = await axios.get(
        `${serverUrl}/api/admin/interviews?${params}`,
        { withCredentials: true }
      );
      setInterviews(res.data.interviews || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, mode, status]);

  useEffect(() => {
    const t = setTimeout(fetchInterviews, 300);
    return () => clearTimeout(t);
  }, [fetchInterviews]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Interview Management</h2>
        <p className="text-gray-500 text-sm mt-1">
          {pagination.totalInterviews} total interviews · paginated 20 per page
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by candidate name or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={mode}
          onChange={(e) => { setMode(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {MODE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Candidate', 'Role', 'Experience', 'Mode', 'Score', 'Status', 'Date'].map(h => (
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
                    {Array(7).fill(0).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : interviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No interviews found
                  </td>
                </tr>
              ) : (
                interviews.map((iv) => (
                  <tr
                    key={iv._id}
                    onClick={() => navigate(`/admin/interviews/${iv._id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {iv.userId?.name?.slice(0, 1).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-28">{iv.userId?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-28">{iv.userId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800 max-w-24 truncate">{iv.role}</td>
                    <td className="px-5 py-4 text-gray-500">{iv.experience}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        iv.mode === 'Technical' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>{iv.mode}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-emerald-600">
                        {iv.finalScore ? `${iv.finalScore.toFixed(1)}/10` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        iv.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        iv.status === 'active'    ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                      }`}>{iv.status}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(iv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalInterviews} interviews
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

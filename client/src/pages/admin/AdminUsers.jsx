import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';

const ROLE_OPTIONS = [
  { label: 'All Roles', value: '' },
  { label: 'User',      value: 'user' },
  { label: 'Admin',     value: 'admin' },
];
const SORT_OPTIONS = [
  { label: 'Newest First',  value: 'newest' },
  { label: 'Oldest First',  value: 'oldest' },
  { label: 'Name A→Z',     value: 'name_asc' },
  { label: 'Name Z→A',     value: 'name_desc' },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalUsers: 0 });
  const [search, setSearch]       = useState('');
  const [role, setRole]           = useState('');
  const [sort, setSort]           = useState('newest');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, search, role, sort });
      const res = await axios.get(
        `${serverUrl}/api/admin/users?${params}`,
        { withCredentials: true }
      );
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, sort]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleToggleStatus = async (e, userId, isActive) => {
    e.stopPropagation();
    setTogglingId(userId);
    try {
      await axios.put(
        `${serverUrl}/api/admin/users/${userId}/status`,
        {},
        { withCredentials: true }
      );
      // Optimistic update
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, isActive: !u.isActive } : u
      ));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-500 text-sm mt-1">
          {pagination.totalUsers} total users · paginated 20 per page
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search name or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['User', 'Role', 'Credits', 'Interviews', 'Avg Score', 'Total Spent', 'Status', 'Joined', 'Actions'].map(h => (
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
                    {Array(9).fill(0).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    onClick={() => navigate(`/admin/users/${u._id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {u.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-32">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-32">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role === 'admin' && <MdAdminPanelSettings size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-700">{u.credits}</td>
                    <td className="px-5 py-4 text-gray-600">{u.totalInterviews || 0}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-emerald-600">
                        {u.avgScore ? Number(u.avgScore).toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {u.totalSpent ? `₹${u.totalSpent}` : '₹0'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.isActive !== false
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {u.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {u.role !== 'admin' && (
                        <button
                          disabled={togglingId === u._id}
                          onClick={(e) => handleToggleStatus(e, u._id, u.isActive)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            u.isActive !== false
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          } disabled:opacity-50`}
                        >
                          {togglingId === u._id ? '...' : u.isActive !== false ? 'Disable' : 'Enable'}
                        </button>
                      )}
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
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalUsers} users
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <FaChevronLeft size={12} />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

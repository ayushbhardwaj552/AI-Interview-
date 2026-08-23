import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUserData } from '../../redux/userSlice';
import { serverUrl } from '../../App';
import axios from 'axios';
import {
  MdDashboard, MdAnalytics, MdPayments, MdMenu, MdClose
} from 'react-icons/md';
import { FaUsers, FaClipboardList } from 'react-icons/fa';
import { HiOutlineLogout } from 'react-icons/hi';
import { BsRobot } from 'react-icons/bs';

const navLinks = [
  { to: '/admin',              label: 'Dashboard',   icon: MdDashboard,    end: true },
  { to: '/admin/users',        label: 'Users',       icon: FaUsers },
  { to: '/admin/interviews',   label: 'Interviews',  icon: FaClipboardList },
  { to: '/admin/payments',     label: 'Payments',    icon: MdPayments },
  { to: '/admin/analytics',    label: 'Analytics',   icon: MdAnalytics },
];

export default function AdminLayout() {
  const { userData } = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.get(serverUrl + '/api/auth/logout', { withCredentials: true });
      dispatch(setUserData(null));
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-800">
        <div className="bg-emerald-600 p-2 rounded-lg">
          <BsRobot size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">InterviewIQ.AI</p>
          <p className="text-emerald-400 text-xs font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {userData?.name?.slice(0, 1).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userData?.name || 'Admin'}</p>
            <p className="text-emerald-400 text-xs">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl text-sm transition-all"
        >
          <HiOutlineLogout size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-gray-950 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 h-full bg-gray-950 flex flex-col">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <MdClose size={22} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-900"
            >
              <MdMenu size={22} />
            </button>
            <div>
              <h1 className="text-gray-800 font-semibold text-base">Admin Dashboard</h1>
              <p className="text-gray-400 text-xs">Platform management & analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
              Admin
            </span>
            <span className="text-sm text-gray-600 hidden sm:block">{userData?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

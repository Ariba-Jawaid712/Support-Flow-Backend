import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Headphones, 
  LayoutDashboard, 
  PlusCircle, 
  ListOrdered, 
  Users, 
  UserCheck, 
  LogOut, 
  User as UserIcon,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-brand">
          <Headphones size={26} />
          <span>SupportFlow</span>
          {user?.role && (
            <span className="brand-badge">{user.role}</span>
          )}
        </Link>

        {isAuthenticated && user && (
          <nav className="nav-links">
            {/* Customer Links */}
            {user.role === 'customer' && (
              <>
                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/requests/new" className={`nav-link ${isActive('/requests/new') ? 'active' : ''}`}>
                  <PlusCircle size={16} /> New Request
                </Link>
              </>
            )}

            {/* Worker Links */}
            {user.role === 'worker' && (
              <>
                <Link to="/worker/dashboard" className={`nav-link ${isActive('/worker/dashboard') ? 'active' : ''}`}>
                  <LayoutDashboard size={16} /> Worker Hub
                </Link>
                <Link to={`/worker/profile/${user._id}`} className={`nav-link ${isActive(`/worker/profile/${user._id}`) ? 'active' : ''}`}>
                  <UserIcon size={16} /> My Ratings
                </Link>
              </>
            )}

            {/* Admin Links */}
            {user.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                  <LayoutDashboard size={16} /> Overview
                </Link>
                <Link to="/admin/worker-requests" className={`nav-link ${isActive('/admin/worker-requests') ? 'active' : ''}`}>
                  <UserCheck size={16} /> Worker Requests
                </Link>
                <Link to="/admin/tickets" className={`nav-link ${isActive('/admin/tickets') ? 'active' : ''}`}>
                  <Layers size={16} /> All Tickets
                </Link>
                <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>
                  <Users size={16} /> Users
                </Link>
              </>
            )}
          </nav>
        )}

        <div className="nav-actions">
          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Headphones
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getStats();
        setStats(res.stats);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Administration</h1>
          <p className="page-subtitle">Oversee user accounts, review worker applications, and monitor service activity.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/worker-requests" className="btn btn-primary">
            <UserCheck size={16} /> Review Worker Applications
          </Link>
          <Link to="/admin/tickets" className="btn btn-secondary">
            <Layers size={16} /> View All Tickets
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading admin metrics...
        </div>
      ) : stats ? (
        <>
          {/* Main Statistics Grid */}
          <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={<Users size={22} />}
              color="var(--primary)"
              bgColor="var(--primary-light)"
            />
            <StatCard
              title="Approved Workers"
              value={stats.approvedWorkers}
              icon={<UserCheck size={22} />}
              color="var(--success)"
              bgColor="var(--success-bg)"
            />
            <StatCard
              title="Pending Worker Apps"
              value={stats.pendingWorkerApplications}
              icon={<Clock size={22} />}
              color="#b45309"
              bgColor="var(--warning-bg)"
            />
            <StatCard
              title="Rejected Worker Apps"
              value={stats.rejectedWorkerApplications}
              icon={<UserX size={22} />}
              color="var(--danger)"
              bgColor="var(--danger-bg)"
            />
          </div>

          <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
            <StatCard
              title="Total Service Requests"
              value={stats.totalRequests}
              icon={<Layers size={22} />}
              color="#1d4ed8"
              bgColor="var(--info-bg)"
            />
            <StatCard
              title="Pending Tickets"
              value={stats.pendingRequests}
              icon={<Clock size={22} />}
              color="#b45309"
              bgColor="var(--warning-bg)"
            />
            <StatCard
              title="Resolved Tickets"
              value={stats.resolvedRequests}
              icon={<CheckCircle2 size={22} />}
              color="var(--success)"
              bgColor="var(--success-bg)"
            />
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-2">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--warning-bg)', color: '#b45309', borderRadius: 'var(--radius-md)' }}>
                  <UserCheck size={20} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Worker Onboarding Queue</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                There are currently <strong>{stats.pendingWorkerApplications}</strong> worker registration applications awaiting administrative review and approval.
              </p>
              <Link to="/admin/worker-requests" className="btn btn-secondary btn-sm">
                Open Worker Requests <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--info-bg)', color: '#1d4ed8', borderRadius: 'var(--radius-md)' }}>
                  <Users size={20} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>User Management</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Manage all {stats.totalCustomers + stats.totalWorkers} registered customer and worker accounts across the platform.
              </p>
              <Link to="/admin/users" className="btn btn-secondary btn-sm">
                View User Directory <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

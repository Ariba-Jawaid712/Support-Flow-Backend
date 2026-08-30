import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Inbox, 
  CheckCircle2, 
  PlayCircle, 
  ShieldAlert, 
  Star, 
  Check, 
  X, 
  ArrowRight,
  User,
  Clock
} from 'lucide-react';
import { workerService } from '../../services/workerService';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { StarRating } from '../../components/common/StarRating';
import { useAuth } from '../../context/AuthContext';

export const WorkerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'my-requests'
  const [availableRequests, setAvailableRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { user } = useAuth();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, availRes, myRes] = await Promise.all([
        workerService.getStats(),
        workerService.getAvailableRequests(),
        workerService.getMyRequests(),
      ]);

      setStats(statsRes.stats);
      setAvailableRequests(availRes.tickets || []);
      setMyRequests(myRes.tickets || []);
    } catch (err) {
      console.error('Failed to load worker dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAccept = async (ticketId) => {
    try {
      setActionLoading(ticketId);
      await workerService.acceptRequest(ticketId);
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (ticketId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      setActionLoading(ticketId);
      await workerService.rejectRequest(ticketId);
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Worker Workspace</h1>
          <p className="page-subtitle">Welcome back, {user?.name}. Accept customer tickets and track your service resolutions.</p>
        </div>
        {stats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rating:</span>
            <StarRating rating={Math.round(stats.averageRating || 5)} readonly size={16} />
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {stats.averageRating > 0 ? stats.averageRating : '5.0'} / 5.0
            </strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({stats.totalReviews} reviews)</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
          <StatCard
            title="Available To Accept"
            value={stats.availableRequests}
            icon={<Inbox size={22} />}
            color="#b45309"
            bgColor="var(--warning-bg)"
          />
          <StatCard
            title="Accepted & In Progress"
            value={stats.acceptedRequests + stats.inProgressRequests}
            icon={<PlayCircle size={22} />}
            color="#1d4ed8"
            bgColor="var(--info-bg)"
          />
          <StatCard
            title="Urgent & Critical"
            value={stats.highPriorityRequests}
            icon={<ShieldAlert size={22} />}
            color="var(--danger)"
            bgColor="var(--danger-bg)"
          />
          <StatCard
            title="Resolved Requests"
            value={stats.resolvedRequests}
            icon={<CheckCircle2 size={22} />}
            color="var(--success)"
            bgColor="var(--success-bg)"
          />
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available Customer Requests ({availableRequests.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'my-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-requests')}
        >
          My Assigned Requests ({myRequests.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading tickets...
          </div>
        ) : activeTab === 'available' ? (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Unassigned Customer Service Requests</h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Click Accept to claim a request and begin working with the customer
              </span>
            </div>

            {availableRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <Clock size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No Pending Requests Available</p>
                <p style={{ fontSize: '0.82rem' }}>All incoming customer requests have been claimed or resolved.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Customer</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Submitted</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableRequests.map((t) => (
                      <tr key={t._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                          {t.ticketNumber}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.customer?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.customer?.email}</div>
                        </td>
                        <td>
                          <strong>{t.subject}</strong>
                        </td>
                        <td>{t.category}</td>
                        <td>
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              disabled={actionLoading === t._id}
                              onClick={() => handleAccept(t._id)}
                            >
                              <Check size={14} /> Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={actionLoading === t._id}
                              onClick={() => handleReject(t._id)}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Your Assigned Requests</h3>
            </div>

            {myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <Inbox size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No Assigned Requests</p>
                <p style={{ fontSize: '0.82rem' }}>You have not accepted any customer requests yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Customer</th>
                      <th>Subject</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Accepted At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((t) => (
                      <tr key={t._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                          {t.ticketNumber}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.customer?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.customer?.email}</div>
                        </td>
                        <td>
                          <strong>{t.subject}</strong>
                        </td>
                        <td>
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td>
                          <StatusBadge status={t.status} />
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {t.acceptedAt ? new Date(t.acceptedAt).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <Link to={`/worker/requests/${t._id}`} className="btn btn-secondary btn-sm">
                            Manage <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

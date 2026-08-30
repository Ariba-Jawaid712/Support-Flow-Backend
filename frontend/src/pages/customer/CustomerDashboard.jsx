import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  HelpCircle, 
  Layers,
  ArrowRight,
  Headphones
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';

export const CustomerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const res = await ticketService.getMyRequests();
        setTickets(res.tickets || []);
      } catch (err) {
        console.error('Failed to load customer requests:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const total = tickets.length;
  const pending = tickets.filter((t) => t.status === 'Pending').length;
  const accepted = tickets.filter((t) => t.status === 'Accepted').length;
  const inProgress = tickets.filter((t) => t.status === 'In Progress').length;
  const resolved = tickets.filter((t) => t.status === 'Resolved').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Support Portal</h1>
          <p className="page-subtitle">Welcome back, {user?.name}. Manage your service and support tickets.</p>
        </div>
        <Link to="/requests/new" className="btn btn-primary">
          <PlusCircle size={18} /> Submit New Request
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Requests"
          value={total}
          icon={<Layers size={24} />}
          color="var(--primary)"
          bgColor="var(--primary-light)"
        />
        <StatCard
          title="Pending Acceptance"
          value={pending}
          icon={<Clock size={24} />}
          color="#b45309"
          bgColor="var(--warning-bg)"
        />
        <StatCard
          title="In Progress"
          value={accepted + inProgress}
          icon={<PlayCircle size={24} />}
          color="#1d4ed8"
          bgColor="var(--info-bg)"
        />
        <StatCard
          title="Resolved"
          value={resolved}
          icon={<CheckCircle2 size={24} />}
          color="var(--success)"
          bgColor="var(--success-bg)"
        />
      </div>

      {/* Tickets List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Your Service & Support Requests</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tickets.length} total</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading requests...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Headphones size={40} style={{ margin: '0 auto 1rem', color: 'var(--primary)', opacity: 0.6 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Requests Found</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              You haven't submitted any service or support requests yet.
            </p>
            <Link to="/requests/new" className="btn btn-primary">
              <PlusCircle size={16} /> Create Your First Request
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Worker</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        {t.ticketNumber}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{t.subject}</strong>
                    </td>
                    <td>{t.category}</td>
                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>
                      {t.assignedWorker ? (
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.assignedWorker.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Awaiting Worker
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/requests/${t._id}`} className="btn btn-secondary btn-sm">
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

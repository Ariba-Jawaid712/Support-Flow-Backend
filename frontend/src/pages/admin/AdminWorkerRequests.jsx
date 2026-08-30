import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Check, X, ArrowLeft, Clock, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const AdminWorkerRequests = () => {
  const [workers, setWorkers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending Approval'); // 'Pending Approval' | 'Approved' | 'Rejected' | ''
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getWorkerRequests(statusFilter);
      setWorkers(res.workers || []);
    } catch (err) {
      console.error('Failed to load worker requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await adminService.approveWorker(id);
      await loadWorkers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve worker');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this worker application?')) return;
    try {
      setActionLoading(id);
      await adminService.rejectWorker(id);
      await loadWorkers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject worker');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/admin/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Admin Overview
        </Link>
        <h1 className="page-title">Worker Registration Requests</h1>
        <p className="page-subtitle">Review worker applications. Approved workers will immediately gain access to handle customer requests.</p>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab-btn ${statusFilter === 'Pending Approval' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Pending Approval')}
        >
          Pending Review
        </button>
        <button
          type="button"
          className={`tab-btn ${statusFilter === 'Approved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Approved')}
        >
          Approved Workers
        </button>
        <button
          type="button"
          className={`tab-btn ${statusFilter === 'Rejected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Rejected')}
        >
          Rejected Applications
        </button>
        <button
          type="button"
          className={`tab-btn ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          All Applications
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading worker requests...
          </div>
        ) : workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <UserCheck size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No Worker Applications Found</p>
            <p style={{ fontSize: '0.82rem' }}>No worker applications match the selected filter ({statusFilter || 'All'}).</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Worker Name</th>
                  <th>Email</th>
                  <th>Skills & Bio</th>
                  <th>Application Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{w.name}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>{w.email}</span>
                    </td>
                    <td>
                      {w.workerSkills && w.workerSkills.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.25rem' }}>
                          {w.workerSkills.map((s, idx) => (
                            <span key={idx} className="badge badge-low" style={{ fontSize: '0.68rem' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {w.workerBio && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                          {w.workerBio}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          w.workerApprovalStatus === 'Approved'
                            ? 'badge-resolved'
                            : w.workerApprovalStatus === 'Rejected'
                            ? 'badge-rejected'
                            : 'badge-pending'
                        }`}
                      >
                        {w.workerApprovalStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {w.workerApprovalStatus !== 'Approved' && (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={actionLoading === w._id}
                            onClick={() => handleApprove(w._id)}
                          >
                            <Check size={14} /> Approve
                          </button>
                        )}
                        {w.workerApprovalStatus !== 'Rejected' && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading === w._id}
                            onClick={() => handleReject(w._id)}
                          >
                            <X size={14} /> Reject
                          </button>
                        )}
                      </div>
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, ToggleLeft, ToggleRight, CheckCircle2, XCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers(roleFilter);
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (id) => {
    try {
      setActionLoading(id);
      await adminService.toggleUserStatus(id);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
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
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="page-title">User Directory</h1>
        <p className="page-subtitle">Manage customer, worker, and administrator accounts.</p>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab-btn ${roleFilter === '' ? 'active' : ''}`}
          onClick={() => setRoleFilter('')}
        >
          All Users
        </button>
        <button
          type="button"
          className={`tab-btn ${roleFilter === 'customer' ? 'active' : ''}`}
          onClick={() => setRoleFilter('customer')}
        >
          Customers
        </button>
        <button
          type="button"
          className={`tab-btn ${roleFilter === 'worker' ? 'active' : ''}`}
          onClick={() => setRoleFilter('worker')}
        >
          Workers
        </button>
        <button
          type="button"
          className={`tab-btn ${roleFilter === 'admin' ? 'active' : ''}`}
          onClick={() => setRoleFilter('admin')}
        >
          Administrators
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading users...
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Worker Approval</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{u.name}</strong>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className="brand-badge" style={{ fontSize: '0.72rem' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === 'worker' ? (
                        <span
                          className={`badge ${
                            u.workerApprovalStatus === 'Approved'
                              ? 'badge-resolved'
                              : u.workerApprovalStatus === 'Rejected'
                              ? 'badge-rejected'
                              : 'badge-pending'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {u.workerApprovalStatus}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${u.isActive ? 'badge-resolved' : 'badge-rejected'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-success'}`}
                        disabled={actionLoading === u._id}
                        onClick={() => handleToggleStatus(u._id)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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

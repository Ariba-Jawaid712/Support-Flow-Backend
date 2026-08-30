import api from './api';

export const adminService = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  getWorkerRequests: async (status = '') => {
    const res = await api.get('/admin/worker-requests', { params: { status } });
    return res.data;
  },

  approveWorker: async (id) => {
    const res = await api.post(`/admin/workers/${id}/approve`);
    return res.data;
  },

  rejectWorker: async (id) => {
    const res = await api.post(`/admin/workers/${id}/reject`);
    return res.data;
  },

  getAllUsers: async (role = '') => {
    const res = await api.get('/admin/users', { params: { role } });
    return res.data;
  },

  toggleUserStatus: async (id) => {
    const res = await api.put(`/admin/users/${id}/status`);
    return res.data;
  },
};

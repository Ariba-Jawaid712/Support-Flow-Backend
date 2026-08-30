import api from './api';

export const workerService = {
  getAvailableRequests: async () => {
    const res = await api.get('/workers/available');
    return res.data;
  },

  getMyRequests: async (status = '') => {
    const res = await api.get('/workers/my-requests', { params: { status } });
    return res.data;
  },

  acceptRequest: async (id) => {
    const res = await api.post(`/workers/requests/${id}/accept`);
    return res.data;
  },

  rejectRequest: async (id) => {
    const res = await api.post(`/workers/requests/${id}/reject`);
    return res.data;
  },

  updateStatus: async (id, nextStatus, note = '') => {
    const res = await api.put(`/workers/requests/${id}/status`, { nextStatus, note });
    return res.data;
  },

  updatePriority: async (id, priority) => {
    const res = await api.put(`/workers/requests/${id}/priority`, { priority });
    return res.data;
  },

  getStats: async () => {
    const res = await api.get('/workers/stats');
    return res.data;
  },

  getProfile: async (id) => {
    const res = await api.get(`/workers/${id}/profile`);
    return res.data;
  },
};

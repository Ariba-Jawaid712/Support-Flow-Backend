import api from './api';

export const ticketService = {
  createTicket: async (data) => {
    const res = await api.post('/tickets', data);
    return res.data;
  },

  getMyRequests: async () => {
    const res = await api.get('/tickets/my-requests');
    return res.data;
  },

  getTicketById: async (id) => {
    const res = await api.get(`/tickets/${id}`);
    return res.data;
  },

  getAllTickets: async (filters = {}) => {
    const res = await api.get('/tickets/all', { params: filters });
    return res.data;
  },

  submitReview: async (ticketId, reviewData) => {
    const res = await api.post(`/tickets/${ticketId}/review`, reviewData);
    return res.data;
  },
};

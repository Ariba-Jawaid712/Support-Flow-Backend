import api from './api';

export const messageService = {
  getMessages: async (ticketId) => {
    const res = await api.get(`/messages/ticket/${ticketId}`);
    return res.data;
  },

  sendMessage: async (ticketId, message) => {
    const res = await api.post(`/messages/ticket/${ticketId}`, { message });
    return res.data;
  },
};

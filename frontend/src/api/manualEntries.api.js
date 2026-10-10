import api from './axios'

export const manualEntriesApi = {
  getEntries: (params) => api.get('/manual-entries', { params }),
  getEntryById: (id) => api.get(`/manual-entries/${id}`),
  createEntry: (data) => api.post('/manual-entries', data),
  updateEntry: (id, data) => api.put(`/manual-entries/${id}`, data),
  addTrackingEvent: (id, data) => api.post(`/manual-entries/${id}/events`, data),
  deleteEntry: (id) => api.delete(`/manual-entries/${id}`)
}

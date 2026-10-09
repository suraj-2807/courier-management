import api from './axios'

export const portalUsersApi = {
  getAll: () => api.get('/portal-users'),
  create: (userData) => api.post('/portal-users', userData),
  update: (id, userData) => api.put(`/portal-users/${id}`, userData),
  toggleStatus: (id) => api.patch(`/portal-users/${id}/status`),
  delete: (id) => api.delete(`/portal-users/${id}`),
  getPermissions: () => api.get('/portal-users/permissions'),
  updatePermissions: (permissions) => api.put('/portal-users/permissions', { permissions }),
  getMyPermissions: () => api.get('/portal-users/me/permissions')
}

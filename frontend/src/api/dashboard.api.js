import api from './axios'

export const dashboardApi = {
  getStats: (period = 'Monthly') => api.get('/dashboard/stats', { params: { period } })
}

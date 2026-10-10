import api from './axios'

export const authApi = {
  getPublicKey: () => api.get('/auth/public-key'),
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
}

import api from './axios'

export async function getSupportInfo() {
  const res = await api.get('/support/info')
  return res.data
}

export async function submitSupportTicket(formData) {
  const res = await api.post('/support/ticket', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data
}

import api from './axios'

export async function getDemoDataStatus() {
  const res = await api.get('/system-settings/demo-status')
  return res.data
}

export async function seedDemoData() {
  const res = await api.post('/system-settings/demo-seed')
  return res.data
}

export async function resetDemoData() {
  const res = await api.post('/system-settings/demo-reset')
  return res.data
}

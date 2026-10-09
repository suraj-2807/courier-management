import api from './axios'

export async function getSetupStatus() {
  const { data } = await api.get('/setup/status')
  return data
}

export async function getPublicBranding() {
  const { data } = await api.get('/setup/branding')
  return data
}

export async function testDatabaseConnection(dbConfig) {
  const { data } = await api.post('/setup/test-db', dbConfig)
  return data
}

export async function initializeDatabase(dbConfig) {
  const { data } = await api.post('/setup/init-db', dbConfig)
  return data
}

export async function saveCompanyBranding(formData) {
  // If formData is an instance of FormData, send multipart/form-data
  const headers = formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  const { data } = await api.post('/setup/save-branding', formData, { headers })
  return data
}

export async function createAdminAccount(adminData) {
  const { data } = await api.post('/setup/create-admin', adminData)
  return data
}

export async function resetPortal() {
  const { data } = await api.post('/setup/reset-portal')
  return data
}

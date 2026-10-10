import app from './app.js'
import { initializeDb } from './config/db.js'
import { startBackgroundTrackingSyncCron } from './services/trackingSync.service.js'

console.log('--- STARTING COURIER ADMIN SERVER ---')
const PORT = process.env.PORT || 5000
console.log(`Attempting to bind to port: ${PORT}`)

// Start server immediately so setup wizard API is accessible even if DB does not exist yet
const server = app.listen(PORT, async () => {
  console.log(`Server successfully running on port ${PORT}`)

  try {
    // Quick connection test before running heavy migrations
    const { getPool } = await import('./config/db.js')
    const testPool = getPool()
    await Promise.race([
      testPool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timed out after 10s')), 10000))
    ])
    console.log('Database connection verified.')

    await Promise.race([
      initializeDb(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB migrations timed out after 60s')), 60000))
    ])
    console.log('Database initialized successfully.')
    // Start background tracking & forwarding number sync cron if DB ready
    startBackgroundTrackingSyncCron()
  } catch (dbErr) {
    console.warn('Database initialization deferred (Setup wizard available at /setup):', dbErr.message)
  }
})

server.on('error', (error) => {
  console.error('SERVER BINDING ERROR:', error)
})
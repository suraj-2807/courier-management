import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query, execute, reconfigurePool, initializeDb } from '../config/db.js'
import { saveLocalBranding, getLocalBranding, getCompanyBranding, DEFAULT_BRANDING } from './branding.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ENV_PATH = path.resolve(__dirname, '..', '..', '.env')
const MIGRATIONS_DIR = path.resolve(__dirname, '..', '..', 'migrations')

/**
 * Update key-value pairs in the .env file cleanly.
 */
export function updateEnvFile(updates = {}) {
  try {
    let envContent = ''
    if (fs.existsSync(ENV_PATH)) {
      envContent = fs.readFileSync(ENV_PATH, 'utf-8')
    }

    const lines = envContent.split(/\r?\n/)
    const updatedKeys = new Set()

    const newLines = lines.map(line => {
      const match = line.match(/^\s*([A-Za-z_0-9]+)\s*=\s*(.*)$/)
      if (match) {
        const key = match[1]
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          updatedKeys.add(key)
          return `${key}=${updates[key]}`
        }
      }
      return line
    })

    // Append any keys that were not already present
    for (const [key, val] of Object.entries(updates)) {
      if (!updatedKeys.has(key)) {
        newLines.push(`${key}=${val}`)
      }
    }

    fs.writeFileSync(ENV_PATH, newLines.join('\n').trim() + '\n', 'utf-8')
    // Also update process.env in-memory
    for (const [key, val] of Object.entries(updates)) {
      process.env[key] = String(val)
    }
    return true
  } catch (err) {
    console.error('[Installer] Error updating .env file:', err)
    return false
  }
}

/**
 * Test raw connection to MySQL server.
 */
export async function testDbConnection({ host = '127.0.0.1', port = 3306, user = 'root', password = '' }) {
  try {
    const conn = await mysql.createConnection({
      host: host || '127.0.0.1',
      port: parseInt(port) || 3306,
      user: user || 'root',
      password: password || '',
      connectTimeout: 5000
    })

    const [dbs] = await conn.query('SHOW DATABASES')
    const databaseNames = dbs.map(d => Object.values(d)[0])
    await conn.end()

    return {
      success: true,
      message: 'Successfully connected to MySQL database server!',
      databases: databaseNames
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to connect to MySQL server. Ensure XAMPP MySQL is running.'
    }
  }
}

/**
 * Initialize database: create DB in XAMPP MySQL, run SQL scripts, and run table migrations.
 */
export async function initializeDatabase({
  host = '127.0.0.1',
  port = 3306,
  user = 'root',
  password = '',
  database = 'express_courier_db'
}) {
  const sanitizedDb = database.trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'express_courier_db'
  const numericPort = parseInt(port) || 3306

  let rootConn
  try {
    // 1. Connect without database to ensure DB exists
    rootConn = await mysql.createConnection({
      host: host || '127.0.0.1',
      port: numericPort,
      user: user || 'root',
      password: password || '',
      multipleStatements: true,
      connectTimeout: 8000
    })

    console.log(`[Installer] Creating database \`${sanitizedDb}\` if not exists...`)
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${sanitizedDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    )
    await rootConn.end()
    rootConn = null

    // 2. Connect directly to the target database with multipleStatements
    const dbConn = await mysql.createConnection({
      host: host || '127.0.0.1',
      port: numericPort,
      user: user || 'root',
      password: password || '',
      database: sanitizedDb,
      multipleStatements: true,
      connectTimeout: 8000
    })

    // Read and run core schema
    const coreSchemaPath = path.join(MIGRATIONS_DIR, 'mysql_schema.sql')
    if (fs.existsSync(coreSchemaPath)) {
      console.log('[Installer] Running mysql_schema.sql...')
      const coreSql = fs.readFileSync(coreSchemaPath, 'utf-8')
      await dbConn.query(coreSql)
    }

    // Read and run rates schema
    const ratesSchemaPath = path.join(MIGRATIONS_DIR, 'rates_schema.sql')
    if (fs.existsSync(ratesSchemaPath)) {
      console.log('[Installer] Running rates_schema.sql...')
      const ratesSql = fs.readFileSync(ratesSchemaPath, 'utf-8')
      await dbConn.query(ratesSql)
    }

    // Read and run vendor rates versioning schema
    const vendorSchemaPath = path.join(MIGRATIONS_DIR, 'vendor_rates_versioning_schema.sql')
    if (fs.existsSync(vendorSchemaPath)) {
      console.log('[Installer] Running vendor_rates_versioning_schema.sql...')
      const vendorSql = fs.readFileSync(vendorSchemaPath, 'utf-8')
      await dbConn.query(vendorSql)
    }

    await dbConn.end()

    // 3. Update .env file
    updateEnvFile({
      DB_HOST: host,
      DB_PORT: numericPort,
      DB_USER: user,
      DB_PASSWORD: password,
      DB_NAME: sanitizedDb,
      REMOTE_DB_ENABLED: 'false',
      WP_SYNC_ENABLED: 'false'
    })

    // 4. Reconfigure backend pool
    reconfigurePool({
      host,
      port: numericPort,
      user,
      password,
      database: sanitizedDb
    })

    // 5. Run self-healing table migrations (creates booking_requests, customers, system_settings, etc.)
    await initializeDb()

    // 6. Verify table creation
    const tables = await query('SHOW TABLES')
    const tableNames = tables.map(t => Object.values(t)[0])

    return {
      success: true,
      message: `Database \`${sanitizedDb}\` prepared successfully with ${tableNames.length} tables.`,
      database: sanitizedDb,
      tablesCount: tableNames.length,
      tables: tableNames
    }
  } catch (err) {
    if (rootConn) {
      try { await rootConn.end() } catch (e) {}
    }
    console.error('[Installer] Database initialization failed:', err)
    throw err
  }
}

/**
 * Save company branding and colors.
 */
export async function saveBrandingConfig(brandingData) {
  const {
    firm_name,
    firm_tagline,
    firm_logo,
    favicon_bg_color,
    color_primary,
    color_primary_dark,
    color_primary_light,
    color_accent,
    color_sidebar,
    firm_phone,
    firm_email,
    firm_website,
    firm_address,
    firm_gstin,
    currency_symbol,
    invoice_prefix,
    tracking_prefix
  } = brandingData

  // Update local file cache first
  saveLocalBranding(brandingData)

  // Save to system_settings table if DB ready
  try {
    const settingsMap = {
      firm_name: firm_name || DEFAULT_BRANDING.firm_name,
      firm_tagline: firm_tagline || DEFAULT_BRANDING.firm_tagline,
      firm_logo: firm_logo || '',
      favicon_bg_color: favicon_bg_color || DEFAULT_BRANDING.favicon_bg_color || '#ffffff',
      color_primary: color_primary || DEFAULT_BRANDING.color_primary,
      color_primary_dark: color_primary_dark || '',
      color_primary_light: color_primary_light || '',
      color_accent: color_accent || DEFAULT_BRANDING.color_accent,
      color_sidebar: color_sidebar || 'navy',
      firm_phone: firm_phone || '',
      firm_email: firm_email || '',
      firm_website: firm_website || '',
      firm_address: firm_address || '',
      firm_gstin: firm_gstin || '',
      currency_symbol: currency_symbol || '₹',
      invoice_prefix: invoice_prefix || 'INV-',
      tracking_prefix: tracking_prefix || 'EXP'
    }

    for (const [key, val] of Object.entries(settingsMap)) {
      if (val !== undefined) {
        await execute(
          `INSERT INTO system_settings (setting_key, setting_value, description)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, String(val), 'Company Branding Setting']
        )
      }
    }
  } catch (err) {
    console.warn('[Installer] Saved to local cache, but DB insert deferred:', err.message)
  }

  return await getCompanyBranding()
}

/**
 * Create or update initial administrator account.
 */
export async function createAdminAccount({ name, email, password }) {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required.')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const cleanEmail = email.trim().toLowerCase()

  // Check if user already exists
  const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [cleanEmail])

  let adminId
  if (existing.length > 0) {
    adminId = existing[0].id
    await execute(
      'UPDATE users SET name = ?, password = ?, role = "super_admin", is_active = 1 WHERE id = ?',
      [name.trim(), hashedPassword, adminId]
    )
  } else {
    const res = await execute(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, "super_admin", 1)',
      [name.trim(), cleanEmail, hashedPassword]
    )
    adminId = res.insertId
  }

  // Mark setup complete in system_settings
  try {
    await execute(
      `INSERT INTO system_settings (setting_key, setting_value, description)
       VALUES ('is_setup_complete', 'true', 'System installation flag')
       ON DUPLICATE KEY UPDATE setting_value = 'true'`
    )
  } catch (e) {}

  saveLocalBranding({ is_setup_complete: 'true' })

  // Sign token
  const jwtSecret = process.env.JWT_SECRET || 'courier_portal_secret_key_2026'
  const token = jwt.sign(
    { id: adminId, email: cleanEmail, role: 'super_admin', name: name.trim() },
    jwtSecret,
    { expiresIn: '7d' }
  )

  return {
    token,
    user: {
      id: adminId,
      name: name.trim(),
      email: cleanEmail,
      role: 'super_admin'
    }
  }
}

/**
 * Check overall system installation and readiness status.
 */
export async function getSystemStatus() {
  const branding = await getCompanyBranding()
  let isDbReady = false
  let hasAdmin = false
  let tableCount = 0
  let isSetupComplete = branding.is_setup_complete === 'true'

  try {
    const tables = await query('SHOW TABLES')
    if (Array.isArray(tables) && tables.length > 5) {
      isDbReady = true
      tableCount = tables.length

      // Check for super_admin or admin user
      const admins = await query("SELECT id, name, email FROM users WHERE role IN ('super_admin', 'admin') LIMIT 1")
      if (admins.length > 0) {
        hasAdmin = true
      }

      // Check system_settings flag
      const settingFlag = await query("SELECT setting_value FROM system_settings WHERE setting_key = 'is_setup_complete' LIMIT 1")
      if (settingFlag.length > 0 && settingFlag[0].setting_value === 'true') {
        isSetupComplete = true
      }
    }
  } catch (err) {
    isDbReady = false
    hasAdmin = false
  }

  let step = 'database'
  if (!isDbReady) {
    step = 'database'
  } else if (!hasAdmin) {
    step = 'admin'
  } else if (!isSetupComplete) {
    step = 'branding'
  } else {
    step = 'complete'
  }

  return {
    isInstalled: isSetupComplete && hasAdmin && isDbReady,
    isDbReady,
    hasAdmin,
    tableCount,
    step,
    currentDatabase: process.env.DB_NAME || 'courier_admin',
    branding
  }
}

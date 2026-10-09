import path from 'path'
import fs from 'fs'
import {
  getSystemStatus,
  testDbConnection,
  initializeDatabase,
  saveBrandingConfig,
  createAdminAccount
} from '../../services/installer.service.js'
import { getCompanyBranding } from '../../services/branding.service.js'
import { execute } from '../../config/db.js'

export async function getStatus(req, res) {
  try {
    const status = await getSystemStatus()
    return res.json({
      success: true,
      ...status
    })
  } catch (err) {
    console.error('[Setup Controller] getStatus error:', err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

export async function getPublicBranding(req, res) {
  try {
    const branding = await getCompanyBranding()
    return res.json({
      success: true,
      branding
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

export async function testDatabase(req, res) {
  try {
    const result = await testDbConnection(req.body)
    return res.json(result)
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

export async function initDb(req, res) {
  try {
    const result = await initializeDatabase(req.body)
    return res.json(result)
  } catch (err) {
    console.error('[Setup Controller] initDb error:', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'Database initialization failed.'
    })
  }
}

export async function saveBranding(req, res) {
  try {
    const payload = { ...req.body }

    // If an image was uploaded through multer
    if (req.file) {
      payload.firm_logo = `/uploads/branding/${req.file.filename}`
    } else if (payload.logo_data_url && payload.logo_data_url.startsWith('data:image/')) {
      // Decode base64 image if passed directly
      const matches = payload.logo_data_url.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/)
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
        const buffer = Buffer.from(matches[2], 'base64')
        const filename = `logo-${Date.now()}.${ext}`
        const uploadDir = path.resolve(process.cwd(), 'uploads', 'branding')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        fs.writeFileSync(path.join(uploadDir, filename), buffer)
        payload.firm_logo = `/uploads/branding/${filename}`
      }
    }

    const branding = await saveBrandingConfig(payload)
    return res.json({
      success: true,
      message: 'Branding and color settings saved successfully!',
      branding
    })
  } catch (err) {
    console.error('[Setup Controller] saveBranding error:', err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

export async function createAdmin(req, res) {
  try {
    const result = await createAdminAccount(req.body)
    return res.json({
      success: true,
      message: 'Administrator account created successfully!',
      ...result
    })
  } catch (err) {
    console.error('[Setup Controller] createAdmin error:', err)
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

export async function resetPortal(req, res) {
  try {
    await execute("UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'is_setup_complete'")
    return res.json({
      success: true,
      message: 'Portal setup reset. You may now reconfigure database settings.'
    })
  } catch (err) {
    console.error('[Setup Controller] resetPortal error:', err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

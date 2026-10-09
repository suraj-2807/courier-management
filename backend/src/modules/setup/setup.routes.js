import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {
  getStatus,
  getPublicBranding,
  testDatabase,
  initDb,
  saveBranding,
  createAdmin,
  resetPortal
} from './setup.controller.js'
import { getSystemStatus } from '../../services/installer.service.js'
import { requireSuperAdmin } from '../../middlewares/auth.middleware.js'

const router = express.Router()

// Setup multer storage for company logo
const uploadDir = path.resolve(process.cwd(), 'uploads', 'branding')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png'
    cb(null, `logo-${Date.now()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files (PNG, JPG, SVG, WebP) are allowed.'))
    }
  }
})

/**
 * Gatekeeper: Once system is installed, only Super Admin can alter branding or DB
 */
const requireSuperAdminIfInstalled = async (req, res, next) => {
  try {
    const status = await getSystemStatus()
    if (status.isInstalled) {
      return requireSuperAdmin(req, res, next)
    }
    next()
  } catch (e) {
    next()
  }
}

// Public info
router.get('/status', getStatus)
router.get('/branding', getPublicBranding)

// Protected once portal is installed
router.post('/test-db', requireSuperAdminIfInstalled, testDatabase)
router.post('/init-db', requireSuperAdminIfInstalled, initDb)
router.post('/save-branding', requireSuperAdminIfInstalled, upload.single('logo'), saveBranding)
router.post('/reset-portal', requireSuperAdminIfInstalled, resetPortal)
router.post('/create-admin', async (req, res, next) => {
  try {
    const status = await getSystemStatus()
    if (status.isInstalled && status.hasAdmin) {
      return requireSuperAdmin(req, res, next)
    }
    next()
  } catch (e) {
    next()
  }
}, createAdmin)

export default router

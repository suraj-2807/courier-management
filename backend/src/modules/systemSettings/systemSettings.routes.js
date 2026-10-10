import express from 'express'
import authMiddleware, { requireSuperAdmin } from '../../middlewares/auth.middleware.js'
import { getSystemSettings, updateSystemSettings } from './systemSettings.controller.js'
import { getDemoDataStatus, seedDemoData, resetDemoData } from './demoData.controller.js'

const router = express.Router()

router.get('/', authMiddleware, getSystemSettings)
router.post('/', requireSuperAdmin, updateSystemSettings)
router.put('/', requireSuperAdmin, updateSystemSettings)

// Demo Data endpoints (Super Admin only)
router.get('/demo-status', requireSuperAdmin, getDemoDataStatus)
router.post('/demo-seed', requireSuperAdmin, seedDemoData)
router.post('/demo-reset', requireSuperAdmin, resetDemoData)

export default router

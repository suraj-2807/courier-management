import express from 'express'
import authMiddleware, { requireSuperAdmin } from '../../middlewares/auth.middleware.js'
import { getSystemSettings, updateSystemSettings } from './systemSettings.controller.js'

const router = express.Router()

router.get('/', authMiddleware, getSystemSettings)
router.post('/', requireSuperAdmin, updateSystemSettings)
router.put('/', requireSuperAdmin, updateSystemSettings)

export default router

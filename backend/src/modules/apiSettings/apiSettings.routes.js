import express from 'express'
import authMiddleware from '../../middlewares/auth.middleware.js'
import { requireModulePermission } from '../../middlewares/permission.middleware.js'

import {
  getApiSettings,
  getApiSettingById,
  createApiSetting,
  updateApiSetting,
  deleteApiSetting,
  testApiConnection,
  toggleApiSetting,
  getActiveVendors,
  saveAuthToken,
  pushTestData,
  getPushLogs,
  getInternalFields,
  extractTemplatePaths
} from './apiSettings.controller.js'

const router = express.Router()

// Active vendors list for booking creation (accessible to all authenticated users)
router.get('/active-vendors', authMiddleware, getActiveVendors)

// ── API Settings & Vendor Credentials (Permitted roles) ──
router.get('/', authMiddleware, requireModulePermission('api_settings'), getApiSettings)
router.get('/internal-fields', authMiddleware, requireModulePermission('api_settings'), getInternalFields)
router.get('/:id', authMiddleware, requireModulePermission('api_settings'), getApiSettingById)
router.post('/', authMiddleware, requireModulePermission('api_settings'), createApiSetting)
router.put('/:id', authMiddleware, requireModulePermission('api_settings'), updateApiSetting)
router.delete('/:id', authMiddleware, requireModulePermission('api_settings'), deleteApiSetting)

// Test, toggle, token, push
router.post('/:id/test', authMiddleware, requireModulePermission('api_settings'), testApiConnection)
router.patch('/:id/toggle', authMiddleware, requireModulePermission('api_settings'), toggleApiSetting)
router.post('/:id/save-auth-token', authMiddleware, requireModulePermission('api_settings'), saveAuthToken)
router.post('/:id/push-test', authMiddleware, requireModulePermission('api_settings'), pushTestData)
router.get('/:id/push-logs', authMiddleware, requireModulePermission('api_settings'), getPushLogs)
router.post('/extract-template-paths', authMiddleware, requireModulePermission('api_settings'), extractTemplatePaths)

export default router

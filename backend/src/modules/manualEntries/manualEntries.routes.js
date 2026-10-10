import express from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import { requireModulePermission } from '../../middlewares/permission.middleware.js'
import {
  getManualEntries,
  getManualEntryById,
  createManualEntry,
  updateManualEntry,
  addTrackingEvent,
  deleteManualEntry,
  publicTrackAwb,
  publicGetVendorEntries
} from './manualEntries.controller.js'

// Admin router (Protected)
const router = express.Router()

router.get('/', authMiddleware, requireModulePermission('api_settings'), getManualEntries)
router.get('/:id', authMiddleware, requireModulePermission('api_settings'), getManualEntryById)
router.post('/', authMiddleware, requireModulePermission('api_settings'), createManualEntry)
router.put('/:id', authMiddleware, requireModulePermission('api_settings'), updateManualEntry)
router.post('/:id/events', authMiddleware, requireModulePermission('api_settings'), addTrackingEvent)
router.delete('/:id', authMiddleware, requireModulePermission('api_settings'), deleteManualEntry)

export default router

// Public external API router (Open for external websites / API consumers)
export const publicManualVendorRouter = express.Router()

// Public Tracking by AWB (e.g. GET /api/v1/manual-vendor/track/:awb)
publicManualVendorRouter.get('/track/:awb', publicTrackAwb)
publicManualVendorRouter.get('/track', publicTrackAwb)

// Public entries list by Vendor Code (e.g. GET /api/v1/manual-vendor/:vendorCode/entries)
publicManualVendorRouter.get('/:vendorCode/entries', publicGetVendorEntries)

// Public single entry tracking by Vendor Code & AWB (e.g. GET /api/v1/manual-vendor/:vendorCode/track/:awb)
publicManualVendorRouter.get('/:vendorCode/track/:awb', publicTrackAwb)
publicManualVendorRouter.get('/:vendorCode/entries/:awb', publicTrackAwb)

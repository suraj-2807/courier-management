import express from 'express'
import multer from 'multer'
import authMiddleware from '../../middlewares/auth.middleware.js'
import { requireModulePermission } from '../../middlewares/permission.middleware.js'

import {
  validateVendorWorkbook,
  importVendorWorkbook,
  getImportBatches,
  getBatchDetail,
  deleteImportBatch,
  getImportVendors
} from './vendorRateImport.controller.js'

const router = express.Router()

// Multer config — store in memory buffer for xlsx parsing
const upload = multer({ storage: multer.memoryStorage() })

// ── Master Vendor Rate Import Operations ──
router.post('/validate', authMiddleware, requireModulePermission('vendor_rate_import'), upload.single('file'), validateVendorWorkbook)
router.post('/import', authMiddleware, requireModulePermission('vendor_rate_import'), upload.single('file'), importVendorWorkbook)
router.get('/batches', authMiddleware, requireModulePermission('vendor_rate_import'), getImportBatches)
router.get('/batches/:batchId', authMiddleware, requireModulePermission('vendor_rate_import'), getBatchDetail)
router.delete('/batches/:batchId', authMiddleware, requireModulePermission('vendor_rate_import'), deleteImportBatch)
router.get('/vendors', authMiddleware, requireModulePermission('vendor_rate_import'), getImportVendors)

export default router

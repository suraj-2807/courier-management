import express from 'express'
import multer from 'multer'
import authMiddleware from '../../middlewares/auth.middleware.js'
import { requireModulePermission } from '../../middlewares/permission.middleware.js'

import {
  uploadExcel,
  getCompanies,
  getCompanyServices,
  getServiceRates,
  getServiceZones,
  updateRateEntry,
  updateZoneEntry,
  deleteService,
  deleteCompany,
  uploadVendorRateSheet,
  getVendorVersions,
  getVendorVersionDetail,
  activateVendorVersion,
  getVendorVersionDiff,
  deleteVendorVersion,
  calculateVendorRate,
  getVendorDestinations
} from './rates.controller.js'

const router = express.Router()

// Multer config — store in memory buffer for xlsx parsing
const upload = multer({ storage: multer.memoryStorage() })

// ── Read Access (Permitted roles) ──
router.get('/companies', authMiddleware, requireModulePermission('rates'), getCompanies)
router.get('/companies/:companyId/services', authMiddleware, requireModulePermission('rates'), getCompanyServices)
router.get('/services/:serviceId/rates', authMiddleware, requireModulePermission('rates'), getServiceRates)
router.get('/services/:serviceId/zones', authMiddleware, requireModulePermission('rates'), getServiceZones)
router.get('/vendors/:vendorCode/versions', authMiddleware, requireModulePermission('rates'), getVendorVersions)
router.get('/vendors/:vendorCode/versions/:versionId', authMiddleware, requireModulePermission('rates'), getVendorVersionDetail)
router.get('/vendors/:vendorCode/versions/:versionId/diff', authMiddleware, requireModulePermission('rates'), getVendorVersionDiff)
router.get('/vendors/:vendorCode/destinations', authMiddleware, requireModulePermission('rates'), getVendorDestinations)
router.post('/calculate', authMiddleware, requireModulePermission('rates'), calculateVendorRate)

// ── Mutations (upload, update, delete) ──
router.post('/upload-excel', authMiddleware, requireModulePermission('rates'), upload.single('file'), uploadExcel)
router.put('/rates/:id', authMiddleware, requireModulePermission('rates'), updateRateEntry)
router.put('/zones/:id', authMiddleware, requireModulePermission('rates'), updateZoneEntry)
router.delete('/companies/:companyId', authMiddleware, requireModulePermission('rates'), deleteCompany)
router.delete('/services/:serviceId', authMiddleware, requireModulePermission('rates'), deleteService)

// Vendor Rate Sheets
router.post('/vendors/:vendorCode/upload', authMiddleware, requireModulePermission('rates'), upload.single('file'), uploadVendorRateSheet)
router.put('/vendors/:vendorCode/versions/:versionId/activate', authMiddleware, requireModulePermission('rates'), activateVendorVersion)
router.delete('/vendors/:vendorCode/versions/:versionId', authMiddleware, requireModulePermission('rates'), deleteVendorVersion)

export default router

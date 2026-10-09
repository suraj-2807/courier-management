import express from 'express'
import authMiddleware from '../../middlewares/auth.middleware.js'
import { requireModulePermission } from '../../middlewares/permission.middleware.js'
import {
  getProducts,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts
} from './product.controller.js'

const router = express.Router()

// ── Read Access ──
router.get('/search', authMiddleware, requireModulePermission('products'), searchProducts)
router.get('/', authMiddleware, requireModulePermission('products'), getProducts)

// ── Mutation Access ──
router.post('/bulk-import', authMiddleware, requireModulePermission('products'), bulkImportProducts)
router.post('/', authMiddleware, requireModulePermission('products'), createProduct)
router.put('/:id', authMiddleware, requireModulePermission('products'), updateProduct)
router.delete('/:id', authMiddleware, requireModulePermission('products'), deleteProduct)

export default router

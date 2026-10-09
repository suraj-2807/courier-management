import express from 'express'
import authMiddleware, { requireSuperAdmin } from '../../middlewares/auth.middleware.js'
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getRolePermissions,
  updateRolePermissions,
  getMyPermissions
} from './users.controller.js'

const router = express.Router()

// User's own resolved permissions (accessible to all authenticated users)
router.get('/me/permissions', authMiddleware, getMyPermissions)

// ── Super Admin Control: Portal Users & Access Permissions ──
router.get('/permissions', requireSuperAdmin, getRolePermissions)
router.put('/permissions', requireSuperAdmin, updateRolePermissions)

router.get('/', requireSuperAdmin, getUsers)
router.post('/', requireSuperAdmin, createUser)
router.put('/:id', requireSuperAdmin, updateUser)
router.patch('/:id/status', requireSuperAdmin, toggleUserStatus)
router.delete('/:id', requireSuperAdmin, deleteUser)

export default router

import express from 'express'
import authMiddleware, { requireSuperAdmin, requireAdminOrSuperAdmin } from '../../middlewares/auth.middleware.js'
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

// ── Role Permissions (Super Admin & Admin) ──
router.get('/permissions', requireAdminOrSuperAdmin, getRolePermissions)
router.put('/permissions', requireAdminOrSuperAdmin, updateRolePermissions)

router.get('/', requireSuperAdmin, getUsers)
router.post('/', requireSuperAdmin, createUser)
router.put('/:id', requireSuperAdmin, updateUser)
router.patch('/:id/status', requireSuperAdmin, toggleUserStatus)
router.delete('/:id', requireSuperAdmin, deleteUser)

export default router

import bcrypt from 'bcryptjs'
import { query, execute } from '../../config/db.js'
import {
  DEFAULT_ROLE_PERMISSIONS,
  MODULE_DEFINITIONS,
  getStoredRolePermissions
} from '../../middlewares/permission.middleware.js'

/**
 * List all registered portal users.
 */
export async function getUsers(req, res) {
  try {
    const users = await query(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users
       ORDER BY id ASC`
    )

    return res.json({
      success: true,
      users
    })
  } catch (err) {
    console.error('[Users] getUsers error:', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch users' })
  }
}

/**
 * Create a new portal user (Normal Admin, Operator, Viewer, or Super Admin).
 */
export async function createUser(req, res) {
  try {
    const { name, email, password, role = 'admin' } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const allowedRoles = ['super_admin', 'admin', 'operator', 'viewer']
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Must be one of: ${allowedRoles.join(', ')}`
      })
    }

    // Only existing super_admin can create another super_admin
    if (role === 'super_admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create another Super Admin account.'
      })
    }

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [cleanEmail])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await execute(
      `INSERT INTO users (name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [name.trim(), cleanEmail, hashedPassword, role]
    )

    const [newUser] = await query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    )

    return res.status(201).json({
      success: true,
      message: `User created successfully as ${role === 'admin' ? 'Normal Admin' : role}`,
      user: newUser
    })
  } catch (err) {
    console.error('[Users] createUser error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Failed to create user' })
  }
}

/**
 * Update an existing portal user (name, email, role, is_active, optional new password).
 */
export async function updateUser(req, res) {
  try {
    const userId = parseInt(req.params.id)
    const { name, email, role, is_active, password } = req.body

    const existingRows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId])
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    const targetUser = existingRows[0]

    // Guard: Prevent demoting the last super_admin
    if (targetUser.role === 'super_admin' && role && role !== 'super_admin') {
      const superAdmins = await query("SELECT id FROM users WHERE role = 'super_admin' AND is_active = 1 AND id != ?", [userId])
      if (superAdmins.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only active Super Admin in the system.'
        })
      }
    }

    // Guard: Only super_admin can promote to super_admin
    if (role === 'super_admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can assign the Super Admin role.'
      })
    }

    // Check duplicate email if email changed
    if (email && email.trim().toLowerCase() !== targetUser.email.toLowerCase()) {
      const dup = await query('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [email.trim().toLowerCase(), userId])
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: 'Email address already in use by another user.' })
      }
    }

    const updates = []
    const params = []

    if (name) {
      updates.push('name = ?')
      params.push(name.trim())
    }
    if (email) {
      updates.push('email = ?')
      params.push(email.trim().toLowerCase())
    }
    if (role) {
      updates.push('role = ?')
      params.push(role)
    }
    if (is_active !== undefined) {
      // Guard: Cannot deactivate self or last super admin
      if (is_active === 0 || is_active === false) {
        if (targetUser.id === req.user?.id) {
          return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' })
        }
        if (targetUser.role === 'super_admin') {
          const activeSupers = await query("SELECT id FROM users WHERE role = 'super_admin' AND is_active = 1 AND id != ?", [userId])
          if (activeSupers.length === 0) {
            return res.status(400).json({ success: false, message: 'Cannot deactivate the only active Super Admin.' })
          }
        }
      }
      updates.push('is_active = ?')
      params.push(is_active ? 1 : 0)
    }
    if (password && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password.trim(), 10)
      updates.push('password = ?')
      params.push(hashed)
    }

    if (updates.length > 0) {
      params.push(userId)
      await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
    }

    const [updatedUser] = await query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    return res.json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser
    })
  } catch (err) {
    console.error('[Users] updateUser error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Failed to update user' })
  }
}

/**
 * Toggle user active/inactive status.
 */
export async function toggleUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.id)

    if (userId === req.user?.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own active status.'
      })
    }

    const rows = await query('SELECT id, role, is_active FROM users WHERE id = ? LIMIT 1', [userId])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const user = rows[0]
    const nextStatus = user.is_active ? 0 : 1

    if (nextStatus === 0 && user.role === 'super_admin') {
      const activeSupers = await query("SELECT id FROM users WHERE role = 'super_admin' AND is_active = 1 AND id != ?", [userId])
      if (activeSupers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the only active Super Admin.'
        })
      }
    }

    await execute('UPDATE users SET is_active = ? WHERE id = ?', [nextStatus, userId])

    return res.json({
      success: true,
      is_active: nextStatus,
      message: `User ${nextStatus ? 'activated' : 'deactivated'} successfully.`
    })
  } catch (err) {
    console.error('[Users] toggleUserStatus error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Delete a user.
 */
export async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id)

    if (userId === req.user?.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      })
    }

    const rows = await query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [userId])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (rows[0].role === 'super_admin') {
      const superAdmins = await query("SELECT id FROM users WHERE role = 'super_admin' AND id != ?", [userId])
      if (superAdmins.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only Super Admin.'
        })
      }
    }

    await execute('DELETE FROM users WHERE id = ?', [userId])

    return res.json({
      success: true,
      message: 'User deleted successfully.'
    })
  } catch (err) {
    console.error('[Users] deleteUser error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Get active role permissions matrix and module definitions.
 */
export async function getRolePermissions(req, res) {
  try {
    const permissions = await getStoredRolePermissions()

    return res.json({
      success: true,
      permissions,
      modules: MODULE_DEFINITIONS,
      roles: [
        { key: 'super_admin', label: 'Super Admin', description: 'Full master access to all modules, system configuration, and user permissions.' },
        { key: 'admin', label: 'Normal Admin', description: 'Comprehensive administrative access to operational and configuration features.' },
        { key: 'operator', label: 'Operator / Staff', description: 'Operational day-to-day access for shipment creation, requests, and tracking.' },
        { key: 'viewer', label: 'Viewer', description: 'Read-only operational visibility.' }
      ]
    })
  } catch (err) {
    console.error('[Users] getRolePermissions error:', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions' })
  }
}

/**
 * Update role permissions matrix (Super Admin only).
 */
export async function updateRolePermissions(req, res) {
  try {
    const { permissions } = req.body

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid permissions payload.' })
    }

    const current = await getStoredRolePermissions()
    const merged = {
      admin: { ...current.admin, ...(permissions.admin || {}) },
      operator: { ...current.operator, ...(permissions.operator || {}) },
      viewer: { ...current.viewer, ...(permissions.viewer || {}) }
    }

    await execute(
      `INSERT INTO system_settings (setting_key, setting_value, description)
       VALUES ('role_permissions', ?, 'Configured Role Based Access Control Matrix')
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(merged)]
    )

    return res.json({
      success: true,
      message: 'Role access permissions updated successfully.',
      permissions: merged
    })
  } catch (err) {
    console.error('[Users] updateRolePermissions error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Get current authenticated user's resolved permissions.
 */
export async function getMyPermissions(req, res) {
  try {
    const role = req.user?.role || 'operator'

    if (role === 'super_admin') {
      // Super admin has every single module granted
      const allTrue = {}
      for (const m of MODULE_DEFINITIONS) {
        allTrue[m.key] = true
      }
      return res.json({
        success: true,
        role: 'super_admin',
        isSuperAdmin: true,
        permissions: allTrue,
        canManageUsers: true
      })
    }

    const allPermissions = await getStoredRolePermissions()
    const rolePerms = allPermissions[role] || DEFAULT_ROLE_PERMISSIONS.operator

    return res.json({
      success: true,
      role,
      isSuperAdmin: false,
      permissions: rolePerms,
      canManageUsers: false
    })
  } catch (err) {
    console.error('[Users] getMyPermissions error:', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions' })
  }
}

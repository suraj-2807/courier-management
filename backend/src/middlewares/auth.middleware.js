import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.'
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'courier_portal_secret_key_2026')

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.'
    })
  }
}

/**
 * Restricts route strictly to Super Admin role.
 * Standard admins and operators are rejected with HTTP 403.
 */
export const requireSuperAdmin = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This feature requires Super Admin privileges.'
      })
    }
    next()
  })
}

/**
 * Allows both Super Admin and Standard Admin roles.
 */
export const requireAdminOrSuperAdmin = (req, res, next) => {
  authMiddleware(req, res, () => {
    const role = req.user?.role
    if (!role || (role !== 'super_admin' && role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Administrator privileges required.'
      })
    }
    next()
  })
}

export default authMiddleware
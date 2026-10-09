import { query } from '../config/db.js'

export const MODULE_DEFINITIONS = [
  { key: 'shipments', label: 'Shipments & Bookings', description: 'Create, edit, view, manifest, and dispatch shipments' },
  { key: 'booking_requests', label: 'Customer Requests', description: 'Review, accept, or reject self-serve customer requests' },
  { key: 'customers', label: 'Customers & Ledgers', description: 'Manage customer accounts, documents, and financial ledgers' },
  { key: 'tracking', label: 'Live Tracking', description: 'Monitor live consignment waybill status and scan events' },
  { key: 'contacts', label: 'Address Book (Contacts)', description: 'Manage sender and receiver contact address entries' },
  { key: 'products', label: 'Products & HSN', description: 'Catalog items, commodity descriptions, and GST/HSN codes' },
  { key: 'rates', label: 'Rate Cards & Calculation', description: 'Manage client rate matrices, zones, and vendor cost sheets' },
  { key: 'vendor_rate_import', label: 'Vendor Rate Import', description: 'Upload and parse multi-zone Excel vendor tariff workbooks' },
  { key: 'api_settings', label: 'API & Vendor Integrations', description: 'Configure live courier push credentials and webhooks' }
]

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    shipments: true,
    booking_requests: true,
    customers: true,
    tracking: true,
    contacts: true,
    products: true,
    rates: true,
    vendor_rate_import: true,
    api_settings: true
  },
  operator: {
    shipments: true,
    booking_requests: true,
    customers: true,
    tracking: true,
    contacts: true,
    products: false,
    rates: false,
    vendor_rate_import: false,
    api_settings: false
  },
  viewer: {
    shipments: true,
    booking_requests: false,
    customers: true,
    tracking: true,
    contacts: true,
    products: false,
    rates: false,
    vendor_rate_import: false,
    api_settings: false
  }
}

export async function getStoredRolePermissions() {
  try {
    const rows = await query("SELECT setting_value FROM system_settings WHERE setting_key = 'role_permissions' LIMIT 1")
    if (rows.length > 0 && rows[0].setting_value) {
      const parsed = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value
      return {
        admin: { ...DEFAULT_ROLE_PERMISSIONS.admin, ...(parsed.admin || {}) },
        operator: { ...DEFAULT_ROLE_PERMISSIONS.operator, ...(parsed.operator || {}) },
        viewer: { ...DEFAULT_ROLE_PERMISSIONS.viewer, ...(parsed.viewer || {}) }
      }
    }
  } catch (err) {
    console.warn('[Permissions] Fallback to default permissions:', err.message)
  }
  return DEFAULT_ROLE_PERMISSIONS
}

/**
 * Middleware factory that enforces access permissions for a specific module.
 * Super Admin always has full access.
 * For other roles, access is checked against the active role_permissions configuration.
 */
export const requireModulePermission = (moduleKey) => {
  return async (req, res, next) => {
    try {
      const user = req.user
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        })
      }

      // Super Admin always bypasses all restrictions
      if (user.role === 'super_admin') {
        return next()
      }

      const permissions = await getStoredRolePermissions()
      const rolePerms = permissions[user.role]

      if (!rolePerms || rolePerms[moduleKey] === false) {
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          module: moduleKey,
          message: `Access to '${moduleKey}' has been restricted by Super Admin for your role (${user.role}).`
        })
      }

      next()
    } catch (err) {
      console.error('[requireModulePermission error]:', err)
      return res.status(500).json({ success: false, message: 'Permission verification failed' })
    }
  }
}

import { query, execute } from '../../config/db.js'

function safeJson(val, fallback = []) {
  if (!val) return fallback
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

/**
 * Admin: List manual vendor entries
 */
export async function getManualEntries(req, res) {
  try {
    const {
      vendor_config_id,
      vendor_code,
      status,
      search,
      page = 1,
      limit = 50
    } = req.query

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
    const conditions = []
    const params = []

    if (vendor_config_id) {
      conditions.push('mve.vendor_config_id = ?')
      params.push(vendor_config_id)
    }

    if (vendor_code) {
      conditions.push('LOWER(mve.vendor_code) = ?')
      params.push(vendor_code.trim().toLowerCase())
    }

    if (status && status !== 'all') {
      conditions.push('mve.current_status = ?')
      params.push(status)
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`
      conditions.push('(LOWER(mve.awb_number) LIKE ? OR LOWER(mve.order_ref) LIKE ? OR LOWER(mve.receiver_name) LIKE ? OR LOWER(mve.sender_name) LIKE ?)')
      params.push(term, term, term, term)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRows = await query(
      `SELECT COUNT(*) as total FROM manual_vendor_entries mve ${whereClause}`,
      params
    )
    const total = countRows[0]?.total || 0

    const rows = await query(
      `SELECT mve.*, vac.name as vendor_name, vac.vendor_code as config_vendor_code
       FROM manual_vendor_entries mve
       LEFT JOIN vendor_api_configs vac ON mve.vendor_config_id = vac.id
       ${whereClause}
       ORDER BY mve.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    )

    const formatted = (rows || []).map(r => ({
      ...r,
      tracking_events: safeJson(r.tracking_events, []),
      custom_metadata: safeJson(r.custom_metadata, {})
    }))

    return res.json({
      success: true,
      entries: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    })
  } catch (err) {
    console.error('[ManualEntries] getManualEntries error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Admin: Get single manual entry by ID
 */
export async function getManualEntryById(req, res) {
  try {
    const { id } = req.params
    const rows = await query(
      `SELECT mve.*, vac.name as vendor_name 
       FROM manual_vendor_entries mve
       LEFT JOIN vendor_api_configs vac ON mve.vendor_config_id = vac.id
       WHERE mve.id = ? LIMIT 1`,
      [id]
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manual entry not found' })
    }

    const entry = {
      ...rows[0],
      tracking_events: safeJson(rows[0].tracking_events, []),
      custom_metadata: safeJson(rows[0].custom_metadata, {})
    }

    return res.json({ success: true, entry })
  } catch (err) {
    console.error('[ManualEntries] getManualEntryById error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Admin: Create a manual vendor entry
 */
export async function createManualEntry(req, res) {
  try {
    const {
      vendor_config_id,
      vendor_code,
      awb_number,
      order_ref,
      sender_name,
      sender_city,
      receiver_name,
      receiver_city,
      destination_pincode,
      service_code,
      service_name,
      weight_kg = 0.5,
      pieces = 1,
      current_status = 'Booked',
      current_location = 'Origin Facility',
      status_description = 'Shipment booked in manual vendor registry',
      expected_delivery = null,
      custom_metadata = {}
    } = req.body

    if (!awb_number || !awb_number.trim()) {
      return res.status(400).json({ success: false, message: 'AWB Number is required' })
    }

    // Resolve vendor config
    let finalVendorConfigId = vendor_config_id
    let finalVendorCode = (vendor_code || '').trim().toLowerCase()

    if (!finalVendorConfigId && finalVendorCode) {
      const cfg = await query('SELECT id FROM vendor_api_configs WHERE LOWER(vendor_code) = ? LIMIT 1', [finalVendorCode])
      if (cfg && cfg.length > 0) {
        finalVendorConfigId = cfg[0].id
      }
    } else if (finalVendorConfigId && !finalVendorCode) {
      const cfg = await query('SELECT vendor_code FROM vendor_api_configs WHERE id = ? LIMIT 1', [finalVendorConfigId])
      if (cfg && cfg.length > 0) {
        finalVendorCode = cfg[0].vendor_code || 'manual'
      }
    }

    if (!finalVendorConfigId) {
      // Find or create default manual vendor if not provided
      const defaultManual = await query("SELECT id, vendor_code FROM vendor_api_configs WHERE auth_type = 'manual' OR LOWER(vendor_code) = 'manual' LIMIT 1")
      if (defaultManual && defaultManual.length > 0) {
        finalVendorConfigId = defaultManual[0].id
        finalVendorCode = defaultManual[0].vendor_code
      } else {
        finalVendorConfigId = 0
        finalVendorCode = finalVendorCode || 'manual'
      }
    }

    const cleanAwb = awb_number.trim().toUpperCase()

    // Check duplicate
    const existing = await query(
      'SELECT id FROM manual_vendor_entries WHERE LOWER(vendor_code) = ? AND UPPER(awb_number) = ? LIMIT 1',
      [finalVendorCode, cleanAwb]
    )
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `AWB Number "${cleanAwb}" already exists for vendor "${finalVendorCode}"`
      })
    }

    // Initial event
    const nowIso = new Date().toISOString()
    const initialEvents = [
      {
        timestamp: nowIso,
        status: current_status,
        location: current_location || 'Origin Hub',
        remarks: status_description || 'Shipment registered'
      }
    ]

    const insertResult = await execute(
      `INSERT INTO manual_vendor_entries (
        vendor_config_id, vendor_code, awb_number, order_ref,
        sender_name, sender_city, receiver_name, receiver_city,
        destination_pincode, service_code, service_name,
        weight_kg, pieces, current_status, current_location,
        status_description, expected_delivery, tracking_events,
        custom_metadata, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalVendorConfigId,
        finalVendorCode,
        cleanAwb,
        order_ref || null,
        sender_name || null,
        sender_city || null,
        receiver_name || null,
        receiver_city || null,
        destination_pincode || null,
        service_code || null,
        service_name || null,
        parseFloat(weight_kg) || 0.5,
        parseInt(pieces, 10) || 1,
        current_status,
        current_location,
        status_description,
        expected_delivery || null,
        JSON.stringify(initialEvents),
        JSON.stringify(custom_metadata || {}),
        true
      ]
    )

    const created = await query('SELECT * FROM manual_vendor_entries WHERE id = ? LIMIT 1', [insertResult.insertId])
    return res.status(201).json({
      success: true,
      message: 'Manual vendor entry created successfully!',
      entry: {
        ...created[0],
        tracking_events: safeJson(created[0]?.tracking_events, []),
        custom_metadata: safeJson(created[0]?.custom_metadata, {})
      }
    })
  } catch (err) {
    console.error('[ManualEntries] createManualEntry error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Admin: Update manual entry
 */
export async function updateManualEntry(req, res) {
  try {
    const { id } = req.params
    const rows = await query('SELECT * FROM manual_vendor_entries WHERE id = ? LIMIT 1', [id])
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manual entry not found' })
    }

    const current = rows[0]
    const {
      order_ref,
      sender_name,
      sender_city,
      receiver_name,
      receiver_city,
      destination_pincode,
      service_code,
      service_name,
      weight_kg,
      pieces,
      current_status,
      current_location,
      status_description,
      expected_delivery,
      custom_metadata,
      is_active
    } = req.body

    let currentEvents = safeJson(current.tracking_events, [])

    // If status or location changed, auto append event
    if (
      (current_status && current_status !== current.current_status) ||
      (current_location && current_location !== current.current_location) ||
      (status_description && status_description !== current.status_description)
    ) {
      currentEvents.unshift({
        timestamp: new Date().toISOString(),
        status: current_status || current.current_status,
        location: current_location || current.current_location || 'Transit Facility',
        remarks: status_description || `Status updated to ${current_status || current.current_status}`
      })
    }

    await execute(
      `UPDATE manual_vendor_entries SET
        order_ref = ?,
        sender_name = ?,
        sender_city = ?,
        receiver_name = ?,
        receiver_city = ?,
        destination_pincode = ?,
        service_code = ?,
        service_name = ?,
        weight_kg = ?,
        pieces = ?,
        current_status = ?,
        current_location = ?,
        status_description = ?,
        expected_delivery = ?,
        tracking_events = ?,
        custom_metadata = ?,
        is_active = ?
       WHERE id = ?`,
      [
        order_ref !== undefined ? order_ref : current.order_ref,
        sender_name !== undefined ? sender_name : current.sender_name,
        sender_city !== undefined ? sender_city : current.sender_city,
        receiver_name !== undefined ? receiver_name : current.receiver_name,
        receiver_city !== undefined ? receiver_city : current.receiver_city,
        destination_pincode !== undefined ? destination_pincode : current.destination_pincode,
        service_code !== undefined ? service_code : current.service_code,
        service_name !== undefined ? service_name : current.service_name,
        weight_kg !== undefined ? parseFloat(weight_kg) : current.weight_kg,
        pieces !== undefined ? parseInt(pieces, 10) : current.pieces,
        current_status !== undefined ? current_status : current.current_status,
        current_location !== undefined ? current_location : current.current_location,
        status_description !== undefined ? status_description : current.status_description,
        expected_delivery !== undefined ? expected_delivery : current.expected_delivery,
        JSON.stringify(currentEvents),
        JSON.stringify(custom_metadata !== undefined ? custom_metadata : safeJson(current.custom_metadata, {})),
        is_active !== undefined ? is_active : current.is_active,
        id
      ]
    )

    const updated = await query('SELECT * FROM manual_vendor_entries WHERE id = ? LIMIT 1', [id])
    return res.json({
      success: true,
      message: 'Manual entry updated successfully!',
      entry: {
        ...updated[0],
        tracking_events: safeJson(updated[0]?.tracking_events, []),
        custom_metadata: safeJson(updated[0]?.custom_metadata, {})
      }
    })
  } catch (err) {
    console.error('[ManualEntries] updateManualEntry error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Admin: Add a milestone tracking event to an entry
 */
export async function addTrackingEvent(req, res) {
  try {
    const { id } = req.params
    const { status, location, remarks, timestamp } = req.body

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' })
    }

    const rows = await query('SELECT * FROM manual_vendor_entries WHERE id = ? LIMIT 1', [id])
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manual entry not found' })
    }

    const current = rows[0]
    let events = safeJson(current.tracking_events, [])

    const newEvent = {
      timestamp: timestamp || new Date().toISOString(),
      status: status.trim(),
      location: (location || current.current_location || 'In Transit').trim(),
      remarks: (remarks || `Shipment milestone: ${status}`).trim()
    }

    // Add to top of timeline
    events.unshift(newEvent)

    await execute(
      `UPDATE manual_vendor_entries SET 
        current_status = ?, 
        current_location = ?, 
        status_description = ?, 
        tracking_events = ? 
       WHERE id = ?`,
      [newEvent.status, newEvent.location, newEvent.remarks, JSON.stringify(events), id]
    )

    return res.json({
      success: true,
      message: 'Tracking event appended successfully!',
      event: newEvent,
      tracking_events: events
    })
  } catch (err) {
    console.error('[ManualEntries] addTrackingEvent error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Admin: Delete manual entry
 */
export async function deleteManualEntry(req, res) {
  try {
    const { id } = req.params
    await execute('DELETE FROM manual_vendor_entries WHERE id = ?', [id])
    return res.json({ success: true, message: 'Manual entry deleted successfully' })
  } catch (err) {
    console.error('[ManualEntries] deleteManualEntry error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * PUBLIC / EXTERNAL REST API:
 * Callable from any other external website, portal, or script without login credentials!
 * GET /api/v1/manual-vendor/track/:awb
 * or GET /api/v1/manual-vendor/:vendorCode/track/:awb
 */
export async function publicTrackAwb(req, res) {
  try {
    const awb = (req.params.awb || req.query.awb || '').trim().toUpperCase()
    const vendorCode = (req.params.vendorCode || req.query.vendor || '').trim().toLowerCase()

    if (!awb) {
      return res.status(400).json({
        success: false,
        message: 'AWB number is required'
      })
    }

    let sql = `
      SELECT mve.*, vac.name as vendor_display_name, vac.is_active as vendor_is_active
      FROM manual_vendor_entries mve
      LEFT JOIN vendor_api_configs vac ON mve.vendor_config_id = vac.id
      WHERE UPPER(mve.awb_number) = ?
    `
    const params = [awb]

    if (vendorCode) {
      sql += ' AND LOWER(mve.vendor_code) = ?'
      params.push(vendorCode)
    }

    sql += ' ORDER BY mve.created_at DESC LIMIT 1'

    const rows = await query(sql, params)

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        tracking_number: awb,
        message: `No shipment record found for AWB: ${awb}`
      })
    }

    const row = rows[0]
    const events = safeJson(row.tracking_events, [])

    return res.json({
      success: true,
      tracking_number: row.awb_number,
      order_reference: row.order_ref,
      vendor: {
        code: row.vendor_code,
        name: row.vendor_display_name || row.vendor_code
      },
      status: row.current_status,
      current_location: row.current_location,
      status_description: row.status_description,
      origin: {
        sender: row.sender_name,
        city: row.sender_city
      },
      destination: {
        receiver: row.receiver_name,
        city: row.receiver_city,
        pincode: row.destination_pincode
      },
      service: {
        code: row.service_code,
        name: row.service_name
      },
      package: {
        weight_kg: row.weight_kg,
        pieces: row.pieces
      },
      expected_delivery: row.expected_delivery,
      events: events,
      last_updated: row.updated_at
    })
  } catch (err) {
    console.error('[ManualEntries] publicTrackAwb error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error tracking shipment' })
  }
}

/**
 * PUBLIC / PARTNER REST API:
 * Fetch all entries added for a specific vendor
 * GET /api/v1/manual-vendor/:vendorCode/entries
 */
export async function publicGetVendorEntries(req, res) {
  try {
    const vendorCode = (req.params.vendorCode || '').trim().toLowerCase()
    const { status, limit = 50, page = 1 } = req.query

    if (!vendorCode) {
      return res.status(400).json({ success: false, message: 'Vendor code parameter is required' })
    }

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
    const conditions = ['LOWER(mve.vendor_code) = ?', 'mve.is_active = TRUE']
    const params = [vendorCode]

    if (status && status !== 'all') {
      conditions.push('mve.current_status = ?')
      params.push(status)
    }

    const countRows = await query(
      `SELECT COUNT(*) as total FROM manual_vendor_entries mve WHERE ${conditions.join(' AND ')}`,
      params
    )
    const total = countRows[0]?.total || 0

    const rows = await query(
      `SELECT mve.id, mve.vendor_code, mve.awb_number, mve.order_ref,
              mve.sender_name, mve.sender_city, mve.receiver_name, mve.receiver_city,
              mve.destination_pincode, mve.service_code, mve.weight_kg, mve.pieces,
              mve.current_status, mve.current_location, mve.status_description,
              mve.expected_delivery, mve.tracking_events, mve.created_at, mve.updated_at
       FROM manual_vendor_entries mve
       WHERE ${conditions.join(' AND ')}
       ORDER BY mve.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    )

    const entries = (rows || []).map(r => ({
      ...r,
      tracking_events: safeJson(r.tracking_events, [])
    }))

    return res.json({
      success: true,
      vendor_code: vendorCode,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      entries
    })
  } catch (err) {
    console.error('[ManualEntries] publicGetVendorEntries error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

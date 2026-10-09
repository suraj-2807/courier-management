import { query } from '../../config/db.js'

export const getDashboardStats = async (req, res) => {
  try {
    const period = (req.query.period || 'Monthly').toLowerCase()

    // 1. Core counters
    const [totalRow] = await query('SELECT COUNT(*) as count FROM shipments')
    const totalBookings = parseInt(totalRow?.count) || 0

    const [deliveredRow] = await query("SELECT COUNT(*) as count FROM shipments WHERE status = 'delivered'")
    const deliveredCount = parseInt(deliveredRow?.count) || 0

    const [pendingRow] = await query("SELECT COUNT(*) as count FROM shipments WHERE status IN ('pending', 'booked')")
    const pendingCount = parseInt(pendingRow?.count) || 0

    const [inTransitRow] = await query("SELECT COUNT(*) as count FROM shipments WHERE status = 'in_transit'")
    const inTransitCount = parseInt(inTransitRow?.count) || 0

    const [failedRow] = await query("SELECT COUNT(*) as count FROM shipments WHERE status IN ('cancelled', 'failed', 'returned', 'rto')")
    const failedCount = parseInt(failedRow?.count) || 0

    const [revenueRow] = await query('SELECT COALESCE(SUM(total_amount), 0) as total FROM shipments')
    const totalRevenue = parseFloat(revenueRow?.total) || 0

    // 2. Trend calculations (Past 30 days vs previous 30-60 days)
    const [current30Row] = await query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as rev FROM shipments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    )
    const [prev30Row] = await query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as rev FROM shipments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    )

    const currCount = parseInt(current30Row?.count) || 0
    const prevCount = parseInt(prev30Row?.count) || 0
    let shipmentTrend = '+0.0%'
    if (prevCount > 0) {
      const pct = (((currCount - prevCount) / prevCount) * 100).toFixed(1)
      shipmentTrend = `${pct >= 0 ? '+' : ''}${pct}%`
    } else if (currCount > 0) {
      shipmentTrend = '+100%'
    }

    const currRev = parseFloat(current30Row?.rev) || 0
    const prevRev = parseFloat(prev30Row?.rev) || 0
    let revenueTrend = '+0.0%'
    if (prevRev > 0) {
      const pct = (((currRev - prevRev) / prevRev) * 100).toFixed(1)
      revenueTrend = `${pct >= 0 ? '+' : ''}${pct}%`
    } else if (currRev > 0) {
      revenueTrend = '+100%'
    }

    // 3. Status breakdown
    const statusRows = await query('SELECT status, COUNT(*) as count FROM shipments GROUP BY status')
    const statusBreakdown = {}
    statusRows.forEach(row => {
      statusBreakdown[row.status] = parseInt(row.count) || 0
    })

    // 4. Carrier / Courier Partner distribution
    const carrierRows = await query(`
      SELECT 
        COALESCE(NULLIF(cp.name, ''), NULLIF(s.vendor_code, ''), NULLIF(s.secondary_carrier, ''), 'Direct Dispatch') as name,
        COUNT(s.id) as count
      FROM shipments s
      LEFT JOIN courier_providers cp ON s.courier_provider_id = cp.id
      GROUP BY name
      ORDER BY count DESC
      LIMIT 5
    `)

    const carrierTotal = carrierRows.reduce((sum, r) => sum + parseInt(r.count), 0)
    const carrierColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#6366F1']
    const carrierSources = carrierRows.map((r, i) => {
      const cnt = parseInt(r.count) || 0
      const sharePct = carrierTotal > 0 ? ((cnt / carrierTotal) * 100).toFixed(1) : '0'
      return {
        name: r.name,
        count: cnt,
        share: `${sharePct}%`,
        stroke: carrierColors[i % carrierColors.length]
      }
    })

    // 5. Recent Bookings (last 10)
    const recentBookings = await query(
      `SELECT s.*,
        JSON_OBJECT('name', snd.name) as senders,
        JSON_OBJECT('name', rcv.name, 'city', rcv.city) as receivers,
        JSON_OBJECT('name', cp.name) as courier_providers
       FROM shipments s
       LEFT JOIN senders snd ON s.sender_id = snd.id
       LEFT JOIN receivers rcv ON s.receiver_id = rcv.id
       LEFT JOIN courier_providers cp ON s.courier_provider_id = cp.id
       ORDER BY s.created_at DESC
       LIMIT 10`
    )

    const parsedRecentBookings = recentBookings.map(row => {
      const { senders, receivers, courier_providers, ...shipment } = row
      return {
        ...shipment,
        senders: senders?.name ? senders : null,
        receivers: receivers?.name ? receivers : null,
        courier_providers: courier_providers?.name ? courier_providers : null
      }
    })

    // 6. Real recent activities from shipments & booking requests
    const shipmentActivities = await query(`
      SELECT 
        s.id,
        s.tracking_number,
        s.status,
        s.created_at,
        rcv.name as receiver_name,
        rcv.city as receiver_city,
        'shipment' as type
      FROM shipments s
      LEFT JOIN receivers rcv ON s.receiver_id = rcv.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `)

    const requestActivities = await query(`
      SELECT 
        br.id,
        br.request_awb,
        br.status,
        br.created_at,
        br.sender_name,
        br.receiver_city,
        'request' as type
      FROM booking_requests br
      ORDER BY br.created_at DESC
      LIMIT 5
    `)

    const combinedActivities = [
      ...shipmentActivities.map(s => ({
        id: `s-${s.id}`,
        title: `Shipment #${s.tracking_number}`,
        description: `Dispatched to ${s.receiver_city || s.receiver_name || 'Destination Hub'} (${s.status})`,
        time: s.created_at,
        type: 'shipment'
      })),
      ...requestActivities.map(r => ({
        id: `r-${r.id}`,
        title: `Request #${r.request_awb}`,
        description: `Submitted by ${r.sender_name || 'Client'} to ${r.receiver_city || 'Destination'}`,
        time: r.created_at,
        type: 'request'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6)

    // 7. Time-series chart generation (Weekly, Monthly, Yearly)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let chartData = []
    const monthlyRevenue = {}

    if (period === 'weekly') {
      // Last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayDataMap = {}

      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayLabel = days[d.getDay()]
        dayDataMap[dateStr] = {
          month: dayLabel,
          date: dateStr,
          amount: 0,
          shipments: 0
        }
      }

      const dailyRows = await query(`
        SELECT DATE(created_at) as day_date, COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total
        FROM shipments
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
      `)

      dailyRows.forEach(r => {
        const dStr = r.day_date ? new Date(r.day_date).toISOString().split('T')[0] : ''
        if (dayDataMap[dStr]) {
          dayDataMap[dStr].amount = parseFloat(r.total) || 0
          dayDataMap[dStr].shipments = parseInt(r.cnt) || 0
        }
      })

      chartData = Object.values(dayDataMap)
      chartData.forEach(cd => {
        monthlyRevenue[cd.month] = cd.amount
      })
    } else if (period === 'yearly') {
      // Last 3 years
      const currentYear = new Date().getFullYear()
      const yearMap = {}

      for (let y = currentYear - 2; y <= currentYear; y++) {
        yearMap[y] = { month: String(y), amount: 0, shipments: 0 }
      }

      const yearlyRows = await query(`
        SELECT YEAR(created_at) as yr, COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total
        FROM shipments
        WHERE YEAR(created_at) >= ?
        GROUP BY YEAR(created_at)
      `, [currentYear - 2])

      yearlyRows.forEach(r => {
        if (yearMap[r.yr]) {
          yearMap[r.yr].amount = parseFloat(r.total) || 0
          yearMap[r.yr].shipments = parseInt(r.cnt) || 0
        }
      })

      chartData = Object.values(yearMap)
      chartData.forEach(cd => {
        monthlyRevenue[cd.month] = cd.amount
      })
    } else {
      // Monthly: continuous sequence of past 6 months
      const sixMonthsMap = {}
      const today = new Date()

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const yr = d.getFullYear()
        const mIdx = d.getMonth()
        const key = `${yr}-${mIdx + 1}`
        const label = monthNames[mIdx]
        sixMonthsMap[key] = {
          month: label,
          amount: 0,
          shipments: 0
        }
        monthlyRevenue[label] = 0
      }

      const monthlyRows = await query(`
        SELECT 
          MONTH(created_at) as month_num,
          YEAR(created_at) as year_num,
          COUNT(*) as cnt,
          COALESCE(SUM(total_amount), 0) as total
        FROM shipments
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year_num, month_num
      `)

      monthlyRows.forEach(row => {
        const key = `${row.year_num}-${row.month_num}`
        if (sixMonthsMap[key]) {
          sixMonthsMap[key].amount = parseFloat(row.total) || 0
          sixMonthsMap[key].shipments = parseInt(row.cnt) || 0
        }
        const label = monthNames[row.month_num - 1]
        monthlyRevenue[label] = parseFloat(row.total) || 0
      })

      chartData = Object.values(sixMonthsMap)
    }

    return res.json({
      success: true,
      stats: {
        totalBookings,
        deliveredCount,
        pendingCount,
        inTransitCount,
        failedCount,
        totalRevenue,
        shipmentTrend,
        revenueTrend,
        statusBreakdown,
        recentBookings: parsedRecentBookings,
        recentActivities: combinedActivities,
        carrierSources,
        monthlyRevenue,
        chartData,
        period
      }
    })
  } catch (error) {
    console.error('[DashboardStats] Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

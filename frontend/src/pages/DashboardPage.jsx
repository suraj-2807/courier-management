import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardStats } from '../hooks/useDashboard'
import {
  Package,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Truck,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Activity,
  Globe,
  Users,
  Compass,
  CheckCircle,
  ExternalLink,
  BarChart3,
  Inbox,
  ClipboardList
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { formatCurrency, formatDate, getStatusLabel } from '../utils/formatters'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import { useBrandingStore } from '../store/brandingStore'

// Donut chart color palette
const DONUT_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#CEF23E', // Lime
  '#0F1014'  // Charcoal
]

// Helper to format relative time
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now - d
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export default function DashboardPage() {
  const { branding } = useBrandingStore()
  const [tableSearch, setTableSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [chartPeriod, setChartPeriod] = useState('Monthly')

  // Pass the selected period to the hook so it fetches correctly
  const { data, isLoading, isError, refetch } = useDashboardStats(chartPeriod)
  const stats = data?.stats

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-9 w-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-[120px] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="skeleton h-[380px] rounded-2xl" />
          <div className="skeleton h-[380px] rounded-2xl" />
          <div className="skeleton h-[380px] rounded-2xl" />
        </div>
        <div className="skeleton h-[340px] rounded-2xl" />
      </div>
    )
  }

  if (isError) return <ErrorState message="Failed to load dashboard metrics" onRetry={refetch} />

  // ── Extract real data (no fake fallbacks) ──
  const totalShipments = stats?.totalBookings || 0
  const deliveredCount = stats?.deliveredCount || 0
  const inTransitCount = stats?.inTransitCount || 0
  const pendingCount = stats?.pendingCount || 0
  const failedCount = stats?.failedCount || 0
  const totalRevenue = stats?.totalRevenue || 0

  // Compute real trend values
  const shipmentTrend = stats?.shipmentTrend || '+0.0%'
  const revenueTrend = stats?.revenueTrend || '+0.0%'
  const deliveryRate = totalShipments > 0 ? ((deliveredCount / totalShipments) * 100).toFixed(1) : '0.0'
  const inTransitRate = totalShipments > 0 ? (((inTransitCount + pendingCount) / totalShipments) * 100).toFixed(1) : '0.0'

  // KPI Cards with real data
  const kpiCards = [
    {
      label: 'Total Shipments',
      value: totalShipments.toLocaleString('en-IN'),
      trend: shipmentTrend,
      isPositive: !shipmentTrend.startsWith('-'),
      timeframe: 'vs last 30 days',
      icon: Package,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      label: 'Delivered On-Time',
      value: deliveredCount.toLocaleString('en-IN'),
      trend: `${deliveryRate}%`,
      isPositive: true,
      timeframe: 'success rate',
      icon: CheckCircle2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Active in Transit',
      value: (inTransitCount + pendingCount).toLocaleString('en-IN'),
      trend: `${inTransitRate}%`,
      isPositive: true,
      timeframe: 'of total',
      icon: Truck,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    },
    {
      label: 'Revenue',
      value: formatCurrency(totalRevenue),
      trend: revenueTrend,
      isPositive: !revenueTrend.startsWith('-'),
      timeframe: 'vs last 30 days',
      icon: IndianRupee,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600'
    }
  ]

  // ── Chart Data ──
  const chartData = stats?.chartData && stats.chartData.length > 0
    ? stats.chartData
    : []

  // ── Donut Breakdown Data ──
  const rawStatusBreakdown = stats?.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0
    ? stats.statusBreakdown
    : {}

  const pieEntries = Object.entries(rawStatusBreakdown).map(([status, count], idx) => ({
    name: getStatusLabel(status),
    status,
    value: Number(count),
    color: DONUT_COLORS[idx % DONUT_COLORS.length]
  }))

  const pieTotal = pieEntries.reduce((sum, item) => sum + item.value, 0)

  // ── Carrier Sources (Real data from API) ──
  const carrierSources = stats?.carrierSources && stats.carrierSources.length > 0
    ? stats.carrierSources
    : []

  // ── Recent Activities (Real data from API) ──
  const recentActivities = stats?.recentActivities && stats.recentActivities.length > 0
    ? stats.recentActivities
    : []

  // ── Filtered Bookings Table ──
  const rawBookings = stats?.recentBookings || []
  const displayBookings = useMemo(() => {
    let list = rawBookings
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase()
      list = list.filter(b =>
        (b.tracking_number || '').toLowerCase().includes(q) ||
        (b.receivers?.name || '').toLowerCase().includes(q) ||
        (b.receivers?.city || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'ALL') {
      list = list.filter(b => b.status === statusFilter)
    }
    return list
  }, [rawBookings, tableSearch, statusFilter])

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ── Top Bar with Title & Fast Action Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Operational telemetry and logistics hub monitoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Top Search Pill */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search item, order, etc"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="bg-white border border-[#E5E8ED] rounded-full pl-9 pr-4 py-2 text-xs text-[#111827] placeholder-[#9CA3AF] w-56 md:w-64 focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15 transition-all shadow-xs"
            />
          </div>

          <Link
            to="/vendor-rate-import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5E8ED] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#6B7280]" />
            Import
          </Link>

          <Link
            to="/bookings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            New Shipment
          </Link>
        </div>
      </div>

      {/* ── KPI Row: 4 Clean Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="bg-white border border-[#E5E8ED] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#6B7280]">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>

              <div className="my-2.5">
                <span className="text-[28px] font-extrabold text-[#111827] tracking-tight leading-none">
                  {card.value}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    card.isPositive
                      ? 'bg-brand-primary-subtle text-brand-primary'
                      : 'bg-[#FEF2F2] text-[#B91C1C]'
                  }`}
                >
                  {card.trend}
                </span>
                <span className="text-[11px] text-[#9CA3AF] font-medium">
                  {card.timeframe}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Visual Insight Row: 3 Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Column 1: Donut Breakdown — 4 cols */}
        <div className="lg:col-span-4 bg-white border border-[#E5E8ED] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#111827]">
                Status Breakdown
              </h2>
              <p className="text-[11px] text-[#9CA3AF]">
                Distribution by fulfillment cycle
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#6B7280] bg-[#F4F5F8] px-2.5 py-1 rounded-lg border border-[#E5E8ED]">
              All Time
            </span>
          </div>

          {pieEntries.length > 0 ? (
            <>
              <div className="flex items-center justify-center py-2">
                <div className="w-[180px] h-[180px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieEntries}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieEntries.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F1014',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          padding: '6px 10px'
                        }}
                        formatter={(val, name) => [`${val} shipments`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Metric Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-[#111827] leading-none">
                      {pieTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] font-semibold uppercase mt-0.5 tracking-wider">
                      Shipments
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend Items */}
              <div className="space-y-2 mt-2 pt-2 border-t border-[#F4F5F8]">
                {pieEntries.map((entry, i) => {
                  const pct = pieTotal > 0 ? Math.round((entry.value / pieTotal) * 100) : 0
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-[#374151] font-medium">
                          {entry.name} <span className="text-[#9CA3AF]">({pct}%)</span>
                        </span>
                      </div>
                      <span className="font-bold text-[#111827]">
                        {entry.value.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="w-10 h-10 text-[#E5E8ED] mb-3" />
              <p className="text-xs font-semibold text-[#6B7280]">No shipment data yet</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">Create shipments to see status breakdown</p>
            </div>
          )}
        </div>

        {/* Column 2: Revenue / Order Chart — 5 cols */}
        <div className="lg:col-span-5 bg-white border border-[#E5E8ED] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#111827]">
                Order Summary
              </h2>
              <p className="text-[11px] text-[#9CA3AF]">
                Booking velocity & turnover
              </p>
            </div>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="text-[11px] font-semibold text-[#6B7280] bg-[#F4F5F8] px-2.5 py-1 rounded-lg border border-[#E5E8ED] focus:outline-none cursor-pointer"
            >
              <option value="This Week">This Week</option>
              <option value="Monthly">Monthly</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* Metric Headline */}
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#111827] tracking-tight">
                {formatCurrency(totalRevenue)}
              </span>
              <span className="text-xs text-[#9CA3AF] font-medium">Total Revenue</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                !revenueTrend.startsWith('-') ? 'bg-brand-primary-subtle text-brand-primary' : 'bg-[#FEF2F2] text-[#B91C1C]'
              }`}>
                {revenueTrend}
              </span>
              <span className="text-[10px] text-[#9CA3AF]">vs previous period</span>
            </div>
          </div>

          {/* Spline Area Chart */}
          <div className="h-[210px] w-full mt-1">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ventorieGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CEF23E" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F5F8" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(val) => {
                      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
                      if (val >= 1000) return `₹${Math.round(val / 1000)}k`
                      return `₹${val}`
                    }}
                    width={48}
                    dx={-2}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0F1014] text-white px-3 py-1.5 rounded-lg shadow-lg text-center">
                            <div className="text-[10px] text-[#9CA3AF]">{payload[0].payload.month}</div>
                            <div className="text-xs font-bold text-[#CEF23E]">{formatCurrency(payload[0].value)}</div>
                            {payload[0].payload.shipments !== undefined && (
                              <div className="text-[10px] text-[#9CA3AF] mt-0.5">{payload[0].payload.shipments} shipments</div>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#ventorieGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BarChart3 className="w-10 h-10 text-[#E5E8ED] mb-3" />
                <p className="text-xs font-semibold text-[#6B7280]">No chart data available</p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">Shipments will populate this chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Traffic / Carrier Source — 3 cols */}
        <div className="lg:col-span-3 bg-white border border-[#E5E8ED] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#111827]">
                Carrier Distribution
              </h2>
              <p className="text-[11px] text-[#9CA3AF]">
                Courier partner usage
              </p>
            </div>
            <button
              type="button"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F4F5F8] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {carrierSources.length > 0 ? (
            <div className="space-y-4 my-auto">
              {carrierSources.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#6B7280] truncate">
                      {c.name}
                    </div>
                    <div className="text-base font-extrabold text-[#111827] leading-tight">
                      {c.share}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF]">
                      {c.count?.toLocaleString()} shipments
                    </div>
                  </div>

                  {/* Progress bar instead of SVG sparkline for real data */}
                  <div className="w-16 flex items-center justify-end">
                    <div className="w-full h-2 bg-[#F4F5F8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: c.share,
                          backgroundColor: c.stroke || DONUT_COLORS[i % DONUT_COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Globe className="w-10 h-10 text-[#E5E8ED] mb-3" />
              <p className="text-xs font-semibold text-[#6B7280]">No carrier data yet</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">Ship via carriers to see distribution</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Operational Grid: Shipments Table & Live Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Section: Recent Shipments Table — 8 cols */}
        <div className="lg:col-span-8 bg-white border border-[#E5E8ED] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-[#E5E8ED] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#111827]">
                Recent Shipments
              </h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                Live dispatch ledger and consignment statuses
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-2.5 py-1.5 font-semibold text-[#4B5563] focus:outline-none focus:border-[#10B981] cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="in_transit">In Transit</option>
                <option value="pending">Pending</option>
                <option value="booked">Booked</option>
              </select>

              <Link
                to="/bookings"
                className="text-xs font-bold text-[#10B981] hover:text-[#059669] flex items-center gap-1 transition-colors"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E5E8ED] bg-[#F9FAFB]">
                  <th className="px-5 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Tracking ID
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Recipient / Client
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F5F8]">
                {displayBookings.length > 0 ? (
                  displayBookings.slice(0, 6).map((b) => (
                    <tr key={b.id} className="hover:bg-[#F9FAFB]/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/bookings/${b.id}`}
                          className="font-bold text-xs text-[#10B981] hover:underline"
                        >
                          {b.tracking_number || b.order_id || `#AWB-${b.id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-[#111827]">
                          {b.receivers?.name || b.senders?.name || 'Walk-in Customer'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#6B7280]">
                        {b.receivers?.city || 'Regional Hub'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={b.status} size="xs" />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#9CA3AF]">
                        {formatDate(b.created_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-xs text-[#111827]">
                        {formatCurrency(b.total_amount || 0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#9CA3AF]">
                      <Inbox className="w-9 h-9 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-semibold text-[#4B5563]">No shipments yet</p>
                      <p className="text-[11px] mt-0.5">Create your first booking to start dispatching</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Section: Recent Activity Feed — 4 cols */}
        <div className="lg:col-span-4 bg-white border border-[#E5E8ED] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-extrabold text-[#111827]">
                  Recent Activity
                </h2>
                <p className="text-[11px] text-[#9CA3AF]">
                  Real-time operational event stream
                </p>
              </div>
              <button
                type="button"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F4F5F8] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {recentActivities.length > 0 ? (
              <>
                <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
                  Latest Events
                </div>

                <div className="space-y-4">
                  {recentActivities.map((act, i) => {
                    const isShipment = act.type === 'shipment'
                    const Icon = isShipment ? Package : ClipboardList
                    const iconBg = isShipment ? 'bg-emerald-50' : 'bg-blue-50'
                    const iconColor = isShipment ? 'text-emerald-600' : 'text-blue-600'

                    return (
                      <div key={act.id || i} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-[#374151] leading-snug">
                            <strong className="font-bold text-[#111827]">{act.title}</strong>{' '}
                            {act.description}
                          </p>
                          <span className="text-[10px] text-[#9CA3AF] font-medium mt-1 inline-block">
                            {timeAgo(act.time)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <Activity className="w-10 h-10 text-[#E5E8ED] mb-3" />
                <p className="text-xs font-semibold text-[#6B7280]">No recent activity</p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">Events will appear here as you work</p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-[#F4F5F8] flex items-center justify-between">
            <span className="text-[11px] text-[#9CA3AF] font-medium">
              Network health: <span className="text-[#10B981] font-bold">Operational</span>
            </span>
            <Link
              to="/tracking"
              className="text-[11px] font-bold text-[#10B981] hover:underline flex items-center gap-1"
            >
              Track Live <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

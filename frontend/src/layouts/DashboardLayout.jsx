import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  MapPin,
  Truck,
  Link2,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Plus,
  LogOut,
  User,
  Users,
  Tag,
  ChevronDown,
  Menu,
  X,
  IndianRupee,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Check,
  CheckCheck,
  FileSpreadsheet,
  ChevronUp,
  ShieldCheck
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useBrandingStore } from '../store/brandingStore'
import api from '../api/axios'
import HelpSupportModal from '../components/help/HelpSupportModal'

/* ── Navigation Configuration ─────────────────── */
const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard, module: 'dashboard' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { label: 'Shipments', path: '/bookings', icon: Package, module: 'shipments' },
      { label: 'Customer Requests', path: '/booking-requests', icon: ClipboardList, module: 'booking_requests' },
      { label: 'Tracking', path: '/tracking', icon: MapPin, module: 'tracking' },
    ]
  },
  {
    label: 'Accounts & Access',
    items: [
      { label: 'Customers', path: '/customers', icon: UserCheck, module: 'customers' },
      { label: 'Users & Contacts', path: '/users', icon: Users, module: 'contacts' },
      { label: 'Permissions & Access', path: '/permissions', icon: ShieldCheck, module: 'permissions', superAdminOnly: true },
    ]
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Products & HSN', path: '/products', icon: Tag, module: 'products' },
      { label: 'Rates', path: '/rates', icon: IndianRupee, module: 'rates' },
      { label: 'Vendor Rate Import', path: '/vendor-rate-import', icon: FileSpreadsheet, module: 'vendor_rate_import' },
      { label: 'API Settings', path: '/api-settings', icon: Settings, module: 'api_settings' },
    ]
  }
]

const bottomNav = [
  { label: 'Settings', path: '/settings', icon: Settings, superAdminOnly: true }
]

/* ── Page Titles for Breadcrumbs ──────────────── */
const pageTitleMap = {
  '/': 'Dashboard',
  '/bookings': 'Shipments',
  '/customers': 'Customers',
  '/booking-requests': 'Customer Requests',
  '/tracking': 'Tracking',
  '/users': 'Users & Contacts',
  '/permissions': 'Permissions & Access Control',
  '/products': 'Products & HSN',
  '/rates': 'Rates',
  '/vendor-rate-import': 'Vendor Rate Import',
  '/api-settings': 'API Settings',
  '/settings': 'General Settings & Branding',
  '/setup': 'Setup Wizard'
}

export default function DashboardLayout({ children }) {
  const { user, logout, isSuperAdmin, getRoleLabel, hasPermission, fetchPermissions } = useAuthStore()
  const { branding, fetchBranding } = useBrandingStore()
  const navigate = useNavigate()
  const location = useLocation()
  const userIsSuperAdmin = isSuperAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [globalSearch, setGlobalSearch] = useState('')
  const [logoError, setLogoError] = useState(false)
  const [readRequestIds, setReadRequestIds] = useState(() => {
    try {
      const stored = localStorage.getItem('read_request_ids')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Load branding & role permissions on mount
  useEffect(() => {
    fetchBranding()
    if (fetchPermissions) {
      fetchPermissions()
    }
  }, [])

  // Auto-logout after 60 minutes of complete user inactivity for security
  useEffect(() => {
    let idleTimer
    const resetTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        logout()
        navigate('/login', { replace: true })
      }, 60 * 60 * 1000)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      clearTimeout(idleTimer)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [logout, navigate])

  const canAccessItem = (item) => {
    if (userIsSuperAdmin) return true
    if (item.superAdminOnly) return false
    if (item.module) return hasPermission(item.module)
    return true
  }

  const [customerFeatureEnabled, setCustomerFeatureEnabled] = useState(true)

  useEffect(() => {
    api.get('/system-settings').then(res => {
      const settings = res.data?.settings || {}
      if (settings.enable_accounting === false || settings.enable_accounting === 'false') {
        setCustomerFeatureEnabled(false)
      } else {
        setCustomerFeatureEnabled(true)
      }
    }).catch(() => {})
  }, [location.pathname])

  const showNotificationBell = customerFeatureEnabled && hasPermission('booking_requests') && hasPermission('customers')

  // Poll for pending customer requests to power notifications and indicators
  const fetchPendingRequests = async () => {
    if (!showNotificationBell) return
    try {
      const { data } = await api.get('/booking-requests', { params: { status: 'pending', limit: 10 } })
      if (data && data.success) {
        setPendingRequests(data.requests || [])
        setPendingCount(data.counts?.pending ?? (data.pagination?.total || 0))
      }
    } catch (e) {
      // Non-blocking
    }
  }

  useEffect(() => {
    if (showNotificationBell) {
      fetchPendingRequests()
      const interval = setInterval(fetchPendingRequests, 20000)
      return () => clearInterval(interval)
    }
  }, [location.pathname, showNotificationBell])

  const unreadRequests = pendingRequests.filter(req => !readRequestIds.includes(req.id))
  const unreadCount = unreadRequests.length

  const handleMarkAllAsRead = (e) => {
    e?.stopPropagation()
    const allIds = Array.from(new Set([...readRequestIds, ...pendingRequests.map(r => r.id)]))
    setReadRequestIds(allIds)
    try {
      localStorage.setItem('read_request_ids', JSON.stringify(allIds))
    } catch {}
  }

  const handleMarkOneAsRead = (id, e) => {
    e?.stopPropagation()
    const newIds = Array.from(new Set([...readRequestIds, id]))
    setReadRequestIds(newIds)
    try {
      localStorage.setItem('read_request_ids', JSON.stringify(newIds))
    } catch {}
  }

  const handleNotificationClick = (req) => {
    handleMarkOneAsRead(req.id)
    setNotificationsOpen(false)
    navigate('/booking-requests')
  }

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'submit') {
      e.preventDefault()
      if (globalSearch.trim()) {
        navigate(`/bookings?search=${encodeURIComponent(globalSearch.trim())}`)
      }
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const currentPageTitle = pageTitleMap[location.pathname] ||
    Object.entries(pageTitleMap).find(([k]) => k !== '/' && location.pathname.startsWith(k))?.[1] ||
    'Page'

  return (
    <div className="flex h-screen overflow-hidden bg-surface-alt">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out select-none
          ${sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[248px]'}
          w-[248px]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--color-navy)' }}
      >
        {/* Close button mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Brand Header ── */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-5' : 'justify-between px-4 py-5'}`}>
          <Link
            to="/"
            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 min-w-0 flex-1 mr-2'} group`}
            title={branding?.firm_name || 'SK Courier'}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: branding?.color_primary || 'var(--color-primary, #2563EB)' }}
            >
              {!logoError && branding?.firm_logo ? (
                <img
                  src={branding.firm_logo}
                  alt={branding?.firm_name || 'Logo'}
                  className="w-7 h-7 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Truck className="w-5 h-5 text-white" />
              )}
            </div>
            {!sidebarCollapsed ? (
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block text-[15px] text-white font-extrabold leading-tight tracking-tight truncate drop-shadow-xs" title={branding?.firm_name || 'SK Courier'}>
                  {branding?.firm_name || 'SK Courier'}
                </span>
                <span className="block text-[10px] text-white/70 font-semibold tracking-wider uppercase mt-0.5 truncate" title={branding?.firm_tagline || 'Logistics'}>
                  {branding?.firm_tagline || 'Logistics'}
                </span>
              </div>
            ) : null}
          </Link>

          {/* Desktop Collapse Toggle */}
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── New Shipment CTA ── */}
        <div className={`mb-3 ${sidebarCollapsed ? 'px-3' : 'px-4'}`}>
          <Link
            to="/bookings/new"
            title="New Shipment"
            className={`flex items-center justify-center font-semibold rounded-lg transition-all duration-200 active:scale-[0.97]
              ${sidebarCollapsed ? 'w-10 h-10 mx-auto' : 'gap-2 w-full py-2.5 text-[13px]'}`}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            {!sidebarCollapsed && <span>New Shipment</span>}
          </Link>
        </div>

        {/* ── Navigation Groups ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll px-3 pb-2">
          {navGroups
            .map(group => ({
              ...group,
              items: group.items.filter(canAccessItem)
            }))
            .filter(group => group.items.length > 0)
            .map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-5' : ''}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-[1.5px]">
                  {group.label}
                </p>
              )}
              {sidebarCollapsed && gi > 0 && (
                <div className="mx-3 mb-2 border-t border-white/[0.06]" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path)
                  const isRequestNav = item.path === '/booking-requests'
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={sidebarCollapsed ? item.label : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={`group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-150
                        ${sidebarCollapsed ? 'justify-center p-2.5 mx-auto' : 'gap-2.5 px-3 py-[8.5px]'}
                        ${active
                          ? 'bg-[#1E2028] text-white shadow-xs font-semibold'
                          : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                        }`}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        />
                      )}
                      <div className="relative flex-shrink-0">
                        <item.icon
                          className="w-[18px] h-[18px]"
                          strokeWidth={active ? 2 : 1.5}
                          style={active ? { color: 'var(--color-primary)' } : undefined}
                        />
                        {isRequestNav && pendingCount > 0 && sidebarCollapsed && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2"
                            style={{
                              backgroundColor: 'var(--color-danger)',
                              ringColor: 'var(--color-navy)'
                            }}
                          />
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {!sidebarCollapsed && isRequestNav && pendingCount > 0 && (
                        <span
                          className="ml-auto min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--color-danger)' }}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Bottom Section (Settings & Log Out matching reference) ── */}
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.06] space-y-0.5">
          {bottomNav.filter(canAccessItem).map((item) => {
            const active = isActive(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-150
                  ${sidebarCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-[8.5px]'}
                  ${active
                    ? 'bg-[#1E2028] text-white shadow-xs font-semibold'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                )}
                <item.icon
                  className="w-[18px] h-[18px] flex-shrink-0"
                  strokeWidth={active ? 2 : 1.5}
                  style={active ? { color: 'var(--color-primary)' } : undefined}
                />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}

          {/* Log Out button (bottom of sidebar like Ventorie / Rixom) */}
          <button
            type="button"
            onClick={logout}
            title="Log Out"
            className={`w-full flex items-center rounded-xl text-[13px] font-medium text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer
              ${sidebarCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-[8.5px]'}`}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Bar ── */}
        <header className="h-[56px] bg-surface border-b border-border flex items-center justify-between px-4 lg:px-5 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>

            {/* Desktop Sidebar Collapse */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-[17px] h-[17px]" />
              ) : (
                <PanelLeftClose className="w-[17px] h-[17px]" />
              )}
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="hidden sm:flex items-center gap-1.5 text-[13px] ml-1">
              <span className="text-text-tertiary font-medium">{branding?.firm_name || 'SK Courier'}</span>
              <ChevronRight className="w-3 h-3 text-text-tertiary/50" />
              <span className="text-text-primary font-semibold">{currentPageTitle}</span>
            </div>

            {/* Global Search */}
            <form
              onSubmit={handleGlobalSearch}
              className="hidden md:flex items-center gap-2 bg-surface-alt border border-border rounded-lg px-3 py-[6px] w-[280px] lg:w-[340px] focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10 transition-all ml-4"
            >
              <Search className="w-[14px] h-[14px] text-text-tertiary flex-shrink-0" />
              <input
                type="text"
                placeholder="Search AWB, customer, city..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
                className="bg-transparent text-[13px] text-text-primary placeholder:text-text-tertiary outline-none w-full"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="text-text-tertiary hover:text-text-secondary cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Notification Bell (Hidden if Customer features / Accounting disabled) */}
            {showNotificationBell && (
              <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                  notificationsOpen ? 'bg-surface-hover text-text-primary' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover'
                }`}
                title="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface"
                    style={{ backgroundColor: 'var(--color-danger)' }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-11 w-80 sm:w-[380px] bg-surface rounded-xl border border-border z-50 overflow-hidden animate-slide-down"
                    style={{ boxShadow: 'var(--shadow-dropdown)' }}
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-text-primary">Notifications</p>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                            style={{
                              backgroundColor: 'var(--color-danger-bg)',
                              color: 'var(--color-danger)',
                              border: '1px solid var(--color-danger-border)'
                            }}
                          >
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[11px] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                            title="Mark all notifications as read"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={fetchPendingRequests}
                          className="text-[11px] font-medium text-text-tertiary hover:text-text-secondary cursor-pointer"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto divide-y divide-border-light">
                      {unreadRequests.length === 0 ? (
                        <div className="p-8 text-center">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-60" style={{ color: 'var(--color-success)' }} />
                          <p className="text-[13px] font-semibold text-text-secondary">All caught up!</p>
                          <p className="text-[11px] text-text-tertiary mt-0.5">No new notifications.</p>
                        </div>
                      ) : (
                        unreadRequests.map((req) => (
                          <div
                            key={req.id}
                            onClick={() => handleNotificationClick(req)}
                            className="p-3.5 hover:bg-surface-alt transition-colors cursor-pointer group flex items-start justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-[12px] font-bold text-text-primary group-hover:text-primary transition-colors">
                                  {req.request_awb || `REQ #${req.id}`}
                                </span>
                                <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                                  {req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                                </span>
                              </div>
                              <p className="text-[11.5px] font-medium text-text-secondary truncate">
                                From: {req.customer_name || req.sender_name || 'Customer'}
                              </p>
                              <div className="flex items-center justify-between text-[11px] text-text-tertiary mt-1">
                                <span>To: {req.receiver_city || req.receiver_country || '—'} · {req.weight || 0} kg</span>
                                <span className="font-semibold inline-flex items-center gap-0.5 text-[10.5px]"
                                  style={{ color: 'var(--color-primary)' }}
                                >
                                  Review <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleMarkOneAsRead(req.id, e)}
                              className="p-1.5 rounded-md border border-border hover:border-primary/30 hover:bg-primary/5 text-text-tertiary hover:text-primary transition-colors cursor-pointer flex-shrink-0 mt-0.5"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 border-t border-border text-center">
                      <Link
                        to="/booking-requests"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[12px] font-semibold hover:underline inline-flex items-center justify-center gap-1 w-full py-1"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        View All Customer Requests ({pendingCount})
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            )}

            {/* Help */}
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer hidden sm:block text-text-tertiary hover:text-text-secondary"
              title="Help & Technical Support (Eryx Codes)"
            >
              <HelpCircle className="w-[18px] h-[18px]" />
            </button>

            {/* Profile */}
            <div className="relative ml-1">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 py-1 px-1.5 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-border overflow-hidden"
                  style={{ backgroundColor: 'var(--color-navy)' }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-[12.5px] font-bold text-text-primary leading-tight truncate">
                    {user?.name || 'Abram Workman'}
                  </span>
                  <span className="text-[10.5px] text-text-tertiary font-medium leading-tight">
                    {getRoleLabel()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-text-tertiary hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div
                    className="absolute right-0 top-11 w-52 bg-surface rounded-xl border border-border z-50 py-1 animate-slide-down"
                    style={{ boxShadow: 'var(--shadow-dropdown)' }}
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-[13px] font-bold text-text-primary truncate">
                        {user?.name || 'Admin User'}
                      </p>
                      <p className="text-[11px] text-text-tertiary truncate">
                        {user?.email || branding?.firm_email || 'admin@courierportal.com'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        setHelpOpen(true)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-text-primary hover:bg-surface-hover transition-colors cursor-pointer border-b border-border-light"
                    >
                      <HelpCircle className="w-[14px] h-[14px] text-primary" />
                      Help & Eryx Support
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-[14px] h-[14px]" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>

      {/* ── Help & Support Modal (Eryx Codes Desk) ── */}
      <HelpSupportModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

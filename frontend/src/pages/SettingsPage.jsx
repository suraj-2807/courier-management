import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Palette,
  Upload,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
  Loader2,
  Trash2,
  Sparkles,
  Info,
  ShieldAlert,
  X,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useBrandingStore } from '../store/brandingStore'
import { useAuthStore } from '../store/authStore'
import { saveCompanyBranding, resetPortal, getPublicBranding } from '../api/setup.api'

const COLOR_PRESETS = [
  { name: 'Ventorie Emerald', primary: '#10B981', accent: '#0F1014' },
  { name: 'Forest Mint', primary: '#059669', accent: '#111827' },
  { name: 'Electric Indigo', primary: '#4F46E5', accent: '#1E293B' },
  { name: 'Oceanic Teal', primary: '#0D9488', accent: '#0F172A' },
  { name: 'Royal Blue', primary: '#2563EB', accent: '#0F172A' },
  { name: 'Midnight Violet', primary: '#7C3AED', accent: '#18181B' }
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { branding, setBranding, fetchBranding } = useBrandingStore()
  const { isSuperAdmin } = useAuthStore()
  const userIsSuperAdmin = isSuperAdmin()

  const [saving, setSaving] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')

  const fileInputRef = useRef(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(branding?.firm_logo || '')

  const [formData, setFormData] = useState({
    firm_name: branding?.firm_name || 'SK Courier',
    firm_tagline: branding?.firm_tagline || 'Enterprise Logistics Control Center',
    color_primary: branding?.color_primary || '#10B981',
    color_accent: branding?.color_accent || '#0F1014',
    color_sidebar: branding?.color_sidebar || 'navy',
    firm_phone: branding?.firm_phone || '',
    firm_email: branding?.firm_email || '',
    firm_website: branding?.firm_website || '',
    firm_address: branding?.firm_address || '',
    firm_gstin: branding?.firm_gstin || '',
    currency_symbol: branding?.currency_symbol || '₹',
    invoice_prefix: branding?.invoice_prefix || 'INV-',
    tracking_prefix: branding?.tracking_prefix || 'EXP'
  })

  // Sync state when branding updates
  useEffect(() => {
    if (branding) {
      setFormData({
        firm_name: branding.firm_name || 'SK Courier',
        firm_tagline: branding.firm_tagline || 'Enterprise Logistics Control Center',
        color_primary: branding.color_primary || '#10B981',
        color_accent: branding.color_accent || '#0F1014',
        color_sidebar: branding.color_sidebar || 'navy',
        firm_phone: branding.firm_phone || '',
        firm_email: branding.firm_email || '',
        firm_website: branding.firm_website || '',
        firm_address: branding.firm_address || '',
        firm_gstin: branding.firm_gstin || '',
        currency_symbol: branding.currency_symbol || '₹',
        invoice_prefix: branding.invoice_prefix || 'INV-',
        tracking_prefix: branding.tracking_prefix || 'EXP'
      })
      setLogoPreview(branding.firm_logo || '')
    }
  }, [branding])

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG, WebP)')
      return
    }
    setLogoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setLogoPreview(previewUrl)
  }

  const handleSaveBranding = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        data.append(k, v || '')
      })
      if (logoFile) {
        data.append('logo', logoFile)
      }

      const res = await saveCompanyBranding(data)
      if (res?.success) {
        toast.success(res.message || 'Settings saved successfully!')
        if (res.branding) {
          setBranding(res.branding)
        }
        await fetchBranding()
      } else {
        toast.error(res?.message || 'Failed to save settings')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPortal = async () => {
    if (resetConfirmText.trim().toLowerCase() !== 'reset') {
      toast.error('Please type "RESET" to confirm')
      return
    }
    setResetting(true)
    try {
      const res = await resetPortal()
      if (res?.success) {
        toast.success('Portal setup reset. Redirecting to Database Connection setup...')
        setResetModalOpen(false)
        navigate('/setup?reset=true')
      } else {
        toast.error(res?.message || 'Failed to reset portal')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-navy tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Settings className="w-5 h-5" />
            </div>
            General Settings & Branding
          </h1>
          <p className="text-[13px] text-text-tertiary mt-1">
            Customize firm name, logos, favicon with white background, color palettes, and invoice parameters.
          </p>
        </div>

        <button
          onClick={handleSaveBranding}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-center"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSaveBranding} className="space-y-6">
        {/* ── Card 1: Brand Identity & Logo ── */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-6">
          <div className="border-b border-border-light pb-4">
            <h2 className="text-[15px] font-extrabold text-navy flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Firm Identity & Live Favicon
            </h2>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              Your logo is rendered on a clean white background to serve as the crisp site favicon on all browser tabs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo Upload & Favicon Preview */}
            <div className="lg:col-span-1 space-y-3">
              <label className="block text-[12px] font-bold text-navy">
                Firm Logo & Tab Favicon
              </label>

              {/* White Background Favicon Frame */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border bg-surface-alt text-center">
                <div className="relative group">
                  {/* The crisp white background container */}
                  <div className="w-24 h-24 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center p-3 overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Firm Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-xs">
                    <Check className="w-3 h-3" />
                  </span>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-[11px] font-bold text-navy block">
                    White Background Favicon
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    Auto-synchronized to browser tab
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-navy bg-white hover:bg-slate-50 border border-border rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  <span>Choose New Logo</span>
                </button>
              </div>
            </div>

            {/* Firm Name & Tagline */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-navy mb-1.5">
                  Firm Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firm_name}
                  onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                  placeholder="e.g. SK Courier & Cargo"
                  className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-navy mb-1.5">
                  Firm Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={formData.firm_tagline}
                  onChange={(e) => setFormData({ ...formData, firm_tagline: e.target.value })}
                  placeholder="e.g. Enterprise Logistics Control Center"
                  className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[12px] font-bold text-navy mb-1.5">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.firm_gstin}
                    onChange={(e) => setFormData({ ...formData, firm_gstin: e.target.value })}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-navy mb-1.5">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.currency_symbol}
                    onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                    placeholder="₹"
                    className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 2: Color Palette & Aesthetics ── */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-6">
          <div className="border-b border-border-light pb-4">
            <h2 className="text-[15px] font-extrabold text-navy flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Theme & Color Palette
            </h2>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              Select tailored color themes or pick custom brand accents.
            </p>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-[12px] font-bold text-navy mb-2">
              Quick Theme Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {COLOR_PRESETS.map((p) => {
                const isSelected = formData.color_primary.toLowerCase() === p.primary.toLowerCase()
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        color_primary: p.primary,
                        color_accent: p.accent
                      })
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border bg-surface-alt hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full shadow-xs" style={{ backgroundColor: p.primary }} />
                      <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: p.accent }} />
                    </div>
                    <span className="text-[11px] font-bold text-navy truncate">
                      {p.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color_primary}
                  onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-surface"
                />
                <input
                  type="text"
                  value={formData.color_primary}
                  onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                  className="flex-1 px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold uppercase text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Accent / Dark Accent
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color_accent}
                  onChange={(e) => setFormData({ ...formData, color_accent: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-surface"
                />
                <input
                  type="text"
                  value={formData.color_accent}
                  onChange={(e) => setFormData({ ...formData, color_accent: e.target.value })}
                  className="flex-1 px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold uppercase text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Sidebar Style
              </label>
              <select
                value={formData.color_sidebar}
                onChange={(e) => setFormData({ ...formData, color_sidebar: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary"
              >
                <option value="navy">Enterprise Deep Navy</option>
                <option value="dark">Charcoal Black (#111827)</option>
                <option value="primary">Brand Tinted Navy</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Card 3: Contact & Document Prefixes ── */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-6">
          <div className="border-b border-border-light pb-4">
            <h2 className="text-[15px] font-extrabold text-navy flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Company Contact & Invoicing
            </h2>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              Contact numbers, support email, and document numbering prefixes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.firm_phone}
                onChange={(e) => setFormData({ ...formData, firm_phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-medium text-text-primary"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={formData.firm_email}
                onChange={(e) => setFormData({ ...formData, firm_email: e.target.value })}
                placeholder="support@courierexpress.com"
                className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-medium text-text-primary"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Website
              </label>
              <input
                type="text"
                value={formData.firm_website}
                onChange={(e) => setFormData({ ...formData, firm_website: e.target.value })}
                placeholder="www.courierexpress.com"
                className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-medium text-text-primary"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Headquarters Address
              </label>
              <input
                type="text"
                value={formData.firm_address}
                onChange={(e) => setFormData({ ...formData, firm_address: e.target.value })}
                placeholder="Main Logistics Hub, Cargo Terminal, City - 110001"
                className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-medium text-text-primary"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                placeholder="INV-"
                className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-navy mb-1.5">
                Tracking Number Prefix
              </label>
              <input
                type="text"
                value={formData.tracking_prefix}
                onChange={(e) => setFormData({ ...formData, tracking_prefix: e.target.value })}
                placeholder="EXP"
                className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold text-text-primary"
              />
            </div>
          </div>
        </div>

        {/* ── Card 4: Danger Zone / Portal Reset ── */}
        {userIsSuperAdmin && (
          <div className="bg-red-50/40 rounded-2xl border border-red-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-extrabold text-red-900">
                    System Maintenance: Reset Portal & Database Setup
                  </h3>
                  <p className="text-[12px] text-red-700/80 mt-1 max-w-2xl leading-relaxed">
                    Database credentials are locked to protect production integrity. Database connection setup is only requested if you initiate a full portal setup reset. Use this only if migrating servers or reconnecting to a new MySQL database.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResetConfirmText('')
                  setResetModalOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors cursor-pointer flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Portal & Reconnect DB</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ── Modal: Reset Confirmation ── */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-navy">
                  Confirm Portal Reset?
                </h3>
                <p className="text-xs text-text-tertiary">
                  This will unlock the database connection setup wizard.
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed bg-surface-alt p-3 rounded-xl border border-border-light">
              This action will return the portal to <strong>Setup Mode</strong>. You will be prompted to re-enter your database credentials (Host, User, Password, DB Name) upon next access.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-text-tertiary uppercase mb-1">
                Type <span className="text-red-600 font-extrabold">RESET</span> below to confirm:
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-hover border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPortal}
                disabled={resetting || resetConfirmText.trim().toLowerCase() !== 'reset'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>Confirm & Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

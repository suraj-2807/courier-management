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
  CreditCard,
  Hash,
  Layers,
  Layout,
  ExternalLink,
  Database,
  Play,
  RotateCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useBrandingStore } from '../store/brandingStore'
import { useAuthStore } from '../store/authStore'
import { saveCompanyBranding, resetPortal } from '../api/setup.api'
import { getDemoDataStatus, seedDemoData, resetDemoData } from '../api/demoData.api'

const COLOR_PRESETS = [
  { name: 'Corporate Royal Blue', primary: '#2563EB', accent: '#0F1014' },
  { name: 'Forest Mint', primary: '#059669', accent: '#111827' },
  { name: 'Electric Indigo', primary: '#4F46E5', accent: '#1E293B' },
  { name: 'Oceanic Teal', primary: '#0D9488', accent: '#0F172A' },
  { name: 'Royal Blue', primary: '#2563EB', accent: '#0F172A' },
  { name: 'Midnight Violet', primary: '#7C3AED', accent: '#18181B' }
]

const FAVICON_BG_PRESETS = [
  { name: 'Crisp White', color: '#ffffff' },
  { name: 'Dark Navy', color: '#0F172A' },
  { name: 'Charcoal', color: '#111827' },
  { name: 'Soft Gray', color: '#F1F5F9' },
  { name: 'Brand Accent', color: 'primary' }
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

  // Demo Data State
  const [demoStatus, setDemoStatus] = useState(null)
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [resettingDemo, setResettingDemo] = useState(false)
  const [demoResetModalOpen, setDemoResetModalOpen] = useState(false)

  const fileInputRef = useRef(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(branding?.firm_logo || '')

  const [formData, setFormData] = useState({
    firm_name: branding?.firm_name || 'SK Courier',
    firm_tagline: branding?.firm_tagline || 'Enterprise Logistics Control Center',
    favicon_bg_color: branding?.favicon_bg_color || '#ffffff',
    color_primary: branding?.color_primary || '#2563EB',
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

  const loadDemoStatus = async () => {
    if (!userIsSuperAdmin) return
    try {
      const res = await getDemoDataStatus()
      if (res?.success) {
        setDemoStatus(res)
      }
    } catch (e) {
      console.warn('Failed to load demo status:', e.message)
    }
  }

  useEffect(() => {
    loadDemoStatus()
  }, [userIsSuperAdmin])

  // Sync state when branding updates
  useEffect(() => {
    if (branding) {
      setFormData({
        firm_name: branding.firm_name || 'SK Courier',
        firm_tagline: branding.firm_tagline || 'Enterprise Logistics Control Center',
        favicon_bg_color: branding.favicon_bg_color || '#ffffff',
        color_primary: branding.color_primary || '#2563EB',
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

  const handleSeedDemoData = async () => {
    setSeedingDemo(true)
    try {
      const res = await seedDemoData()
      if (res?.success) {
        toast.success(res.message || '10 demo entries loaded across all modules!')
        await loadDemoStatus()
      } else {
        toast.error(res?.message || 'Failed to seed demo data')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating demo entries')
    } finally {
      setSeedingDemo(false)
    }
  }

  const handleResetDemoData = async () => {
    setResettingDemo(true)
    try {
      const res = await resetDemoData()
      if (res?.success) {
        toast.success(res.message || 'All demo data removed successfully!')
        setDemoResetModalOpen(false)
        await loadDemoStatus()
      } else {
        toast.error(res?.message || 'Failed to reset demo data')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error removing demo entries')
    } finally {
      setResettingDemo(false)
    }
  }

  const currentFavBg = formData.favicon_bg_color || '#ffffff'

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-2 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Customization</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight flex items-center gap-3">
            General Settings & Branding
          </h1>
          <p className="text-xs sm:text-sm text-text-tertiary mt-1">
            Configure firm identity, tab favicon background color, color schemes, and system numbering parameters.
          </p>
        </div>

        <button
          onClick={handleSaveBranding}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark active:scale-[0.98] rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer self-start sm:self-center"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSaveBranding} className="space-y-8">
        {/* ── Card 1: Brand Identity & Live Favicon ── */}
        <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="p-6 border-b border-border-light bg-gradient-to-r from-surface to-surface-alt/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-navy flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                Firm Identity & Live Favicon
              </h2>
              <p className="text-xs text-text-tertiary mt-1">
                Customize your firm name, high-resolution logo, and customizable browser tab favicon background.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border text-[11px] font-bold text-text-secondary">
              <span>Favicon BG:</span>
              <span className="w-3 h-3 rounded-full border border-border inline-block shadow-xs" style={{ backgroundColor: currentFavBg }} />
              <span className="font-mono text-[10px] uppercase">{currentFavBg}</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Logo Upload & Favicon Simulation */}
            <div className="lg:col-span-5 space-y-4">
              <label className="block text-xs font-bold text-navy">
                Logo & Tab Favicon Preview
              </label>

              {/* Realistic Browser Tab Simulation */}
              <div className="p-4 rounded-xl border border-border/80 bg-slate-900/5 dark:bg-slate-950/40">
                <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Browser Tab Simulation</span>
                  <span className="text-[10px] font-normal lowercase text-text-tertiary">Real-time sync</span>
                </div>
                
                {/* Simulated Tab Bar */}
                <div className="bg-slate-200/70 dark:bg-slate-800/60 p-2 pb-0 rounded-t-xl border border-slate-300/60 dark:border-slate-700/60 flex items-center">
                  <div className="bg-white dark:bg-slate-900 border-t border-x border-slate-300/80 dark:border-slate-700 rounded-t-lg px-3 py-1.5 flex items-center gap-2 max-w-[240px] shadow-xs">
                    {/* The Mini Tab Favicon */}
                    <div
                      className="w-4 h-4 rounded-xs flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs transition-all"
                      style={{ backgroundColor: currentFavBg }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Favicon" className="w-3.5 h-3.5 object-contain p-0.5" />
                      ) : (
                        <span className="text-[8px] font-extrabold text-primary leading-none">
                          {(formData.firm_name || 'SK').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {formData.firm_name || 'SK Courier'} — Admin
                    </span>
                    <span className="text-slate-400 hover:text-slate-600 text-[10px] ml-auto cursor-pointer">×</span>
                  </div>
                </div>
              </div>

              {/* Favicon Canvas Frame */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border/90 bg-surface-alt/40 text-center">
                <div className="relative group">
                  <div
                    className="w-24 h-24 rounded-2xl shadow-lg border border-border flex items-center justify-center p-3.5 overflow-hidden transition-all duration-300"
                    style={{ backgroundColor: currentFavBg }}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Firm Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary/60 mb-1" />
                        <span className="text-[10px] font-extrabold text-navy">
                          {(formData.firm_name || 'SK').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-xs font-bold text-navy block">
                    Dynamic Favicon Container
                  </span>
                  <span className="text-[11px] text-text-tertiary">
                    Synchronizes live to browser tab icon
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-navy bg-surface hover:bg-surface-hover border border-border rounded-xl transition-all cursor-pointer shadow-xs hover:border-primary/40"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Upload New Logo</span>
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null)
                        setLogoPreview('')
                        setFormData({ ...formData, firm_logo: '' })
                      }}
                      className="p-2 text-text-tertiary hover:text-red-600 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                      title="Clear logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Favicon Background Color Chooser */}
              <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    Favicon Background Color
                  </label>
                  <span className="text-[11px] font-mono text-text-tertiary uppercase">
                    {currentFavBg}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  {FAVICON_BG_PRESETS.map((p) => {
                    const presetColor = p.color === 'primary' ? formData.color_primary : p.color
                    const isSelected = currentFavBg.toLowerCase() === presetColor.toLowerCase()
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, favicon_bg_color: presetColor })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-primary'
                            : 'border-border bg-surface-alt hover:bg-surface-hover text-text-secondary'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-border shadow-2xs"
                          style={{ backgroundColor: presetColor }}
                        />
                        <span>{p.name}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Custom Picker */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative">
                    <input
                      type="color"
                      value={currentFavBg}
                      onChange={(e) => setFormData({ ...formData, favicon_bg_color: e.target.value })}
                      className="w-9 h-9 rounded-xl cursor-pointer border border-border p-0.5 bg-surface"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.favicon_bg_color}
                    onChange={(e) => setFormData({ ...formData, favicon_bg_color: e.target.value })}
                    placeholder="#ffffff"
                    className="flex-1 px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold uppercase text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Firm Details Fields */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Firm Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.firm_name}
                    onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                    placeholder="e.g. SK Courier & Cargo"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Firm Tagline / Subtitle
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                    <TagIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.firm_tagline}
                    onChange={(e) => setFormData({ ...formData, firm_tagline: e.target.value })}
                    placeholder="e.g. Enterprise Logistics Control Center"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    GSTIN / Tax Registration ID
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.firm_gstin}
                      onChange={(e) => setFormData({ ...formData, firm_gstin: e.target.value })}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    Currency Symbol
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                      <span className="text-sm font-bold">₹</span>
                    </div>
                    <input
                      type="text"
                      value={formData.currency_symbol}
                      onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                      placeholder="₹"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm font-bold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
                <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  The firm identity and primary brand color are globally applied to invoices, dispatch waybills, dashboard cards, customer portal headers, and browser tabs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 2: Theme & Color Palette ── */}
        <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="p-6 border-b border-border-light bg-gradient-to-r from-surface to-surface-alt/50">
            <h2 className="text-base font-extrabold text-navy flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              Theme & Dynamic Color Palette
            </h2>
            <p className="text-xs text-text-tertiary mt-1">
              Select one of our curated enterprise design palettes or customize your brand colors.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Themes */}
            <div>
              <label className="block text-xs font-bold text-navy mb-3">
                Curated Theme Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2.5 hover:scale-[1.02] ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                          : 'border-border bg-surface-alt hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full shadow-xs border border-white/40" style={{ backgroundColor: p.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/40" style={{ backgroundColor: p.accent }} />
                      </div>
                      <span className="text-[11px] font-bold text-navy truncate">
                        {p.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Colors Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-border-light">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy">
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
                    className="flex-1 px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold uppercase text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy">
                  Accent / Contrast Tone
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
                    className="flex-1 px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold uppercase text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy">
                  Sidebar Theme Style
                </label>
                <select
                  value={formData.color_sidebar}
                  onChange={(e) => setFormData({ ...formData, color_sidebar: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="navy">Enterprise Deep Navy</option>
                  <option value="dark">Charcoal Black (#111827)</option>
                  <option value="primary">Brand Tinted Navy</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 3: Contact & Document Prefixes ── */}
        <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="p-6 border-b border-border-light bg-gradient-to-r from-surface to-surface-alt/50">
            <h2 className="text-base font-extrabold text-navy flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              Contact Details & Serial Prefixes
            </h2>
            <p className="text-xs text-text-tertiary mt-1">
              Contact numbers, support inbox, and automatic serial numbering prefixes for shipments and invoices.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.firm_phone}
                  onChange={(e) => setFormData({ ...formData, firm_phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">
                Support Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.firm_email}
                  onChange={(e) => setFormData({ ...formData, firm_email: e.target.value })}
                  placeholder="support@courierexpress.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">
                Website
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.firm_website}
                  onChange={(e) => setFormData({ ...formData, firm_website: e.target.value })}
                  placeholder="www.courierexpress.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-navy mb-1.5">
                Headquarters Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.firm_address}
                  onChange={(e) => setFormData({ ...formData, firm_address: e.target.value })}
                  placeholder="Main Logistics Hub, Cargo Terminal, City - 110001"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">
                Invoice Number Prefix
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.invoice_prefix}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                  placeholder="INV-"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">
                Tracking Number Prefix
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.tracking_prefix}
                  onChange={(e) => setFormData({ ...formData, tracking_prefix: e.target.value })}
                  placeholder="EXP"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 4: Super Admin Demo Data Showcase & Management ── */}
        {userIsSuperAdmin && (
          <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-6 border-b border-border-light bg-surface-alt/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 mb-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Demonstration Environment</span>
                </div>
                <h3 className="text-base font-extrabold text-navy flex items-center gap-2">
                  10 Demo Showcase Entries & Clean Reset
                </h3>
                <p className="text-xs text-text-tertiary mt-1 max-w-xl">
                  Quickly generate 10 realistic demo records across Users, Shipments, Live Tracking Events, and Manual No-API Vendor entries for client walkthroughs, then purge them instantly when done.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSeedDemoData}
                  disabled={seedingDemo || resettingDemo}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {seedingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Add 10 Demo Entries</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoResetModalOpen(true)}
                  disabled={seedingDemo || resettingDemo || !demoStatus?.hasDemoData}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {resettingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Reset / Remove Demo Data</span>
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-surface-alt/30">
                <span className="text-[11px] font-bold text-text-tertiary uppercase">Demo Users</span>
                <div className="text-xl font-extrabold text-navy mt-1">
                  {demoStatus?.counts?.users || 0}
                  <span className="text-xs font-normal text-text-tertiary ml-1.5">accounts</span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface-alt/30">
                <span className="text-[11px] font-bold text-text-tertiary uppercase">Demo Shipments</span>
                <div className="text-xl font-extrabold text-navy mt-1">
                  {demoStatus?.counts?.shipments || 0}
                  <span className="text-xs font-normal text-text-tertiary ml-1.5">consignments</span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface-alt/30">
                <span className="text-[11px] font-bold text-text-tertiary uppercase">Manual Vendors</span>
                <div className="text-xl font-extrabold text-navy mt-1">
                  {demoStatus?.counts?.manualEntries || 0}
                  <span className="text-xs font-normal text-text-tertiary ml-1.5">entries</span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface-alt/30">
                <span className="text-[11px] font-bold text-text-tertiary uppercase">Demo Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${demoStatus?.hasDemoData ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-xs font-bold text-navy">
                    {demoStatus?.hasDemoData ? 'Active Demo Data' : 'Clean Database'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Card 5: Danger Zone / Portal Reset ── */}
        {userIsSuperAdmin && (
          <div className="bg-red-50/50 rounded-2xl border border-red-200/80 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-red-900">
                    System Maintenance: Reset Portal & Database Setup
                  </h3>
                  <p className="text-xs text-red-700/80 mt-1 max-w-2xl leading-relaxed">
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

            <p className="text-xs text-text-secondary leading-relaxed bg-surface-alt p-3.5 rounded-xl border border-border-light">
              This action will return the portal to <strong>Setup Mode</strong>. You will be prompted to re-enter your database credentials (Host, User, Password, DB Name) upon next access.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-text-tertiary uppercase mb-1.5">
                Type <span className="text-red-600 font-extrabold">RESET</span> below to confirm:
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-alt border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-red-500 transition-all"
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>Confirm & Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Demo Data Reset Confirmation ── */}
      {demoResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-navy">
                  Remove All Demo Data?
                </h3>
                <p className="text-xs text-text-tertiary">
                  This will safely purge only demo entries (shipments, tracking events, users, manual entries).
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed bg-surface-alt p-3.5 rounded-xl border border-border-light">
              Your genuine live shipments, real customers, and master account will remain 100% untouched. Only records flagged with <code>DEMO-</code> or <code>@demo.courier.internal</code> will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDemoResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-hover border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemoData}
                disabled={resettingDemo}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {resettingDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TagIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Database,
  Building2,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Server,
  KeyRound,
  Upload,
  Palette,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
  Truck,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getSetupStatus,
  testDatabaseConnection,
  initializeDatabase,
  saveCompanyBranding,
  createAdminAccount
} from '../api/setup.api'
import { useBrandingStore } from '../store/brandingStore'
import { useAuthStore } from '../store/authStore'

const COLOR_PRESETS = [
  { name: 'Ventorie Lime & Charcoal', primary: '#10B981', accent: '#0F1014', lime: '#CEF23E' },
  { name: 'Rixom Emerald Mint', primary: '#059669', accent: '#111827', lime: '#34D399' },
  { name: 'Electric Indigo', primary: '#4F46E5', accent: '#1E293B', lime: '#818CF8' },
  { name: 'Oceanic Teal', primary: '#0D9488', accent: '#0F172A', lime: '#2DD4BF' },
  { name: 'Royal Blue & Amber', primary: '#2563EB', accent: '#0F172A', lime: '#F59E0B' },
  { name: 'Midnight Violet', primary: '#7C3AED', accent: '#18181B', lime: '#C084FC' }
]

export default function SetupPage() {
  const navigate = useNavigate()
  const { branding, setBranding, fetchBranding } = useBrandingStore()
  const { setAuth } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(1) // 1: DB, 2: Branding, 3: Admin, 4: Done
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [systemStatus, setSystemStatus] = useState(null)

  // Step 1: DB State
  const [dbConfig, setDbConfig] = useState({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'courier_portal_db'
  })
  const [testingDb, setTestingDb] = useState(false)
  const [testDbResult, setTestDbResult] = useState(null)
  const [initializingDb, setInitializingDb] = useState(false)

  // Step 2: Branding State
  const [firmForm, setFirmForm] = useState({
    firm_name: 'SK Courier Express',
    firm_tagline: 'Fast, Secure & Worldwide Logistics Control Center',
    color_primary: '#10B981',
    color_accent: '#0F1014',
    color_sidebar: 'navy',
    firm_phone: '+91 98765 43210',
    firm_email: 'admin@courierexpress.com',
    firm_website: 'www.courierexpress.com',
    firm_address: 'Main Logistics Hub, Cargo Terminal, City - 110001',
    firm_gstin: '',
    currency_symbol: '₹',
    invoice_prefix: 'INV-',
    tracking_prefix: 'EXP'
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [savingBranding, setSavingBranding] = useState(false)
  const fileInputRef = useRef(null)

  // Step 3: Admin State
  const [adminForm, setAdminForm] = useState({
    name: 'Abram Workman',
    email: 'admin@courierexpress.com',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [creatingAdmin, setCreatingAdmin] = useState(false)

  // Initial status check
  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setLoadingStatus(true)
    try {
      const res = await getSetupStatus()
      if (res?.success) {
        setSystemStatus(res)
        if (res.branding) {
          setFirmForm((prev) => ({
            ...prev,
            ...res.branding
          }))
          if (res.branding.firm_logo) {
            setLogoPreview(res.branding.firm_logo)
          }
        }
        if (res.currentDatabase) {
          setDbConfig((prev) => ({ ...prev, database: res.currentDatabase }))
        }
        if (res.isInstalled) {
          if (!window.location.search.includes('reset=true')) {
            navigate('/settings', { replace: true })
            return
          }
          setCurrentStep(1)
        } else if (res.isDbReady) {
          if (!res.hasAdmin) {
            setCurrentStep(3)
          } else {
            setCurrentStep(2)
          }
        }
      }
    } catch (err) {
      console.warn('Status check warning:', err.message)
    } finally {
      setLoadingStatus(false)
    }
  }

  // Database Connection Test
  const handleTestDb = async () => {
    setTestingDb(true)
    setTestDbResult(null)
    try {
      const res = await testDatabaseConnection(dbConfig)
      setTestDbResult(res)
      if (res.success) {
        toast.success(res.message || 'Connected to MySQL successfully!')
      } else {
        toast.error(res.message || 'Failed to connect to MySQL.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Connection error'
      setTestDbResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setTestingDb(false)
    }
  }

  // Database Initialization
  const handleInitDb = async () => {
    setInitializingDb(true)
    try {
      const res = await initializeDatabase(dbConfig)
      if (res.success) {
        toast.success(`Database "${res.database}" initialized successfully!`)
        setCurrentStep(2)
      } else {
        toast.error(res.message || 'Database initialization failed.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Database setup failed'
      toast.error(msg)
    } finally {
      setInitializingDb(false)
    }
  }

  // Handle Logo Upload
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file must be under 5MB')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Apply preset color
  const handleSelectPreset = (preset) => {
    setFirmForm((prev) => ({
      ...prev,
      color_primary: preset.primary,
      color_accent: preset.accent
    }))
    setBranding({
      color_primary: preset.primary,
      color_accent: preset.accent
    })
  }

  // Save Branding
  const handleSaveBranding = async () => {
    if (!firmForm.firm_name.trim()) {
      toast.error('Please enter the Firm / Company Name')
      return
    }

    setSavingBranding(true)
    try {
      const fd = new FormData()
      Object.entries(firmForm).forEach(([k, v]) => {
        fd.append(k, v || '')
      })
      if (logoFile) {
        fd.append('logo', logoFile)
      } else if (logoPreview && logoPreview.startsWith('data:image/')) {
        fd.append('logo_data_url', logoPreview)
      }

      const res = await saveCompanyBranding(fd)
      if (res.success) {
        toast.success('Company branding saved!')
        setBranding(res.branding || firmForm)
        setCurrentStep(3)
      } else {
        toast.error(res.message || 'Failed to save branding')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save error'
      toast.error(msg)
    } finally {
      setSavingBranding(false)
    }
  }

  // Create Super Admin Account
  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password) {
      toast.error('All admin fields are required')
      return
    }
    if (adminForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (adminForm.password !== adminForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setCreatingAdmin(true)
    try {
      const res = await createAdminAccount({
        name: adminForm.name,
        email: adminForm.email,
        password: adminForm.password
      })

      if (res.success) {
        toast.success('Admin account created successfully!')
        if (res.token && res.user) {
          setAuth(res.user, res.token)
        }
        await fetchBranding()
        setCurrentStep(4)
      } else {
        toast.error(res.message || 'Failed to create administrator account')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Creation error'
      toast.error(msg)
    } finally {
      setCreatingAdmin(false)
    }
  }

  const steps = [
    { num: 1, title: 'Database', desc: 'XAMPP MySQL config', icon: Database },
    { num: 2, title: 'Branding', desc: 'Colors & identity', icon: Building2 },
    { num: 3, title: 'Admin Account', desc: 'Super administrator', icon: UserCheck },
    { num: 4, title: 'Launch', desc: 'Ready to use', icon: CheckCircle2 }
  ]

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-9 h-9 text-emerald-600 animate-spin mb-3" />
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Checking System Status...</h2>
        <p className="text-gray-500 text-xs mt-1">Preparing installation wizard</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-[#111827] flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-[#E5E8ED] bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-all text-white font-bold"
              style={{ backgroundColor: firmForm.color_primary || '#10B981' }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <Truck className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-[#111827] leading-tight">
                {firmForm.firm_name || 'SK Courier Express'}
              </h1>
              <p className="text-[11px] text-[#6B7280] font-medium">Enterprise Control Center Setup</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              XAMPP MySQL Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Step Progress Indicators */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((s) => {
              const Icon = s.icon
              const isDone = currentStep > s.num
              const isCurrent = currentStep === s.num
              return (
                <div
                  key={s.num}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-white border-[#111827] shadow-sm'
                      : isDone
                      ? 'bg-white border-emerald-300 text-gray-700'
                      : 'bg-white/60 border-[#E5E8ED] text-gray-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#111827] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : <span>{s.num}</span>}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Step {s.num}
                    </div>
                    <div
                      className={`text-[13px] font-bold truncate ${
                        isCurrent ? 'text-[#111827]' : isDone ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {s.title}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* STEP 1: DATABASE SETUP */}
        {currentStep === 1 && (
          <div className="bg-white border border-[#E5E8ED] rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="max-w-2xl mb-7">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2.5 border border-emerald-100">
                <Database className="w-3.5 h-3.5" /> Database Configuration
              </div>
              <h2 className="text-[22px] font-extrabold text-[#111827] tracking-tight">
                Connect to Local MySQL (XAMPP)
              </h2>
              <p className="text-gray-500 text-[13px] mt-1 leading-relaxed">
                Enter your local MySQL server connection parameters. If XAMPP is running, default host{' '}
                <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">127.0.0.1</code> and user{' '}
                <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">root</code> without password will connect automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Database Host
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    placeholder="127.0.0.1"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Port
                </label>
                <input
                  type="number"
                  value={dbConfig.port}
                  onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                  placeholder="3306"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  MySQL Username
                </label>
                <input
                  type="text"
                  value={dbConfig.user}
                  onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                  placeholder="root"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  MySQL Password <span className="text-gray-400 font-normal">(Leave blank if none)</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={dbConfig.password}
                    onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                    placeholder="Empty by default in XAMPP"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Database Name
                </label>
                <input
                  type="text"
                  value={dbConfig.database}
                  onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                  placeholder="courier_portal_db"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono font-bold transition-all"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  The database will be automatically created in MySQL if it doesn't already exist.
                </p>
              </div>
            </div>

            {/* Test Connection Feedback */}
            {testDbResult && (
              <div
                className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
                  testDbResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {testDbResult.success ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                )}
                <div className="text-xs">
                  <div className="font-bold">{testDbResult.message}</div>
                  {testDbResult.databases && (
                    <div className="text-gray-600 mt-0.5">
                      Available databases: {testDbResult.databases.slice(0, 5).join(', ')}
                      {testDbResult.databases.length > 5 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-[#E5E8ED]">
              <button
                type="button"
                onClick={handleTestDb}
                disabled={testingDb || initializingDb}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E5E8ED] bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Test Connection
              </button>

              <button
                type="button"
                onClick={handleInitDb}
                disabled={initializingDb}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {initializingDb ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing Database...
                  </>
                ) : (
                  <>
                    Initialize Database & Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COMPANY BRANDING & PALETTE */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white border border-[#E5E8ED] rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-100">
                  <Building2 className="w-3.5 h-3.5" /> Step 2: Brand Identity
                </div>
                <h2 className="text-[22px] font-extrabold text-[#111827] tracking-tight">
                  Company Name, Logo & Color Palette
                </h2>
                <p className="text-gray-500 text-[13px] mt-1">
                  Customize the look, colors, and business info to match your brand.
                </p>
              </div>

              {/* Color Presets */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Curated Design Palettes (Inspired by reference UI)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COLOR_PRESETS.map((p) => {
                    const active = firmForm.color_primary.toUpperCase() === p.primary.toUpperCase()
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          active
                            ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                            : 'border-[#E5E8ED] bg-[#F9FAFB] hover:bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex items-center -space-x-1">
                            <span
                              className="w-5 h-5 rounded-full border border-white shadow-2xs"
                              style={{ backgroundColor: p.primary }}
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white shadow-2xs"
                              style={{ backgroundColor: p.accent }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-800 truncate">{p.name}</span>
                        </div>
                        {active && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Hex Color Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={firmForm.color_primary}
                      onChange={(e) => {
                        setFirmForm({ ...firmForm, color_primary: e.target.value })
                        setBranding({ color_primary: e.target.value })
                      }}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={firmForm.color_primary}
                      onChange={(e) => {
                        setFirmForm({ ...firmForm, color_primary: e.target.value })
                        setBranding({ color_primary: e.target.value })
                      }}
                      className="flex-1 bg-white border border-[#E5E8ED] rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Sidebar / Dark Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={firmForm.color_accent}
                      onChange={(e) => {
                        setFirmForm({ ...firmForm, color_accent: e.target.value })
                        setBranding({ color_accent: e.target.value })
                      }}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={firmForm.color_accent}
                      onChange={(e) => {
                        setFirmForm({ ...firmForm, color_accent: e.target.value })
                        setBranding({ color_accent: e.target.value })
                      }}
                      className="flex-1 bg-white border border-[#E5E8ED] rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Firm Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Company / Firm Name *
                  </label>
                  <input
                    type="text"
                    value={firmForm.firm_name}
                    onChange={(e) => setFirmForm({ ...firmForm, firm_name: e.target.value })}
                    placeholder="e.g. SK Courier Express"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={firmForm.firm_tagline}
                    onChange={(e) => setFirmForm({ ...firmForm, firm_tagline: e.target.value })}
                    placeholder="Fast, Secure & Worldwide"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Upload className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Logo Image
                    </button>
                    <p className="text-[11px] text-gray-500 mt-1">
                      PNG, WebP, SVG or JPG (transparent background recommended)
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={firmForm.firm_phone}
                    onChange={(e) => setFirmForm({ ...firmForm, firm_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={firmForm.firm_email}
                    onChange={(e) => setFirmForm({ ...firmForm, firm_email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Hub / Office Address
                </label>
                <textarea
                  rows={2}
                  value={firmForm.firm_address}
                  onChange={(e) => setFirmForm({ ...firmForm, firm_address: e.target.value })}
                  placeholder="Main Cargo Hub, Terminal Road, City - Pincode"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Numbering Prefixes & Currency */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={firmForm.currency_symbol}
                    onChange={(e) => setFirmForm({ ...firmForm, currency_symbol: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3 py-2 text-sm text-gray-800 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={firmForm.invoice_prefix}
                    onChange={(e) => setFirmForm({ ...firmForm, invoice_prefix: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3 py-2 text-sm text-gray-800 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Tracking Prefix
                  </label>
                  <input
                    type="text"
                    value={firmForm.tracking_prefix}
                    onChange={(e) => setFirmForm({ ...firmForm, tracking_prefix: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3 py-2 text-sm text-gray-800 text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-[#E5E8ED]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl border border-[#E5E8ED] text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSaveBranding}
                  disabled={savingBranding}
                  className="px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingBranding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      Save Branding & Continue
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Interactive Preview Column */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white border border-[#E5E8ED] rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" /> Live Sidebar Preview
                </h3>

                <div className="bg-[#0F1014] rounded-2xl p-4 shadow-sm text-white">
                  <div className="flex items-center gap-3 pb-3.5 border-b border-white/[0.08]">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: firmForm.color_primary }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-5 h-5 object-contain" />
                      ) : (
                        <Truck className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-extrabold text-white truncate">
                        {firmForm.firm_name || 'SK Courier'}
                      </div>
                      <div className="text-[9.5px] text-gray-400 tracking-wider uppercase truncate">
                        {firmForm.firm_tagline || 'Logistics'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <div className="p-2 rounded-xl text-xs font-semibold text-white bg-[#1E2028] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: firmForm.color_primary }} />
                      Active Navigation Item
                    </div>
                    <div className="p-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-gray-500" /> Shipment Operations
                    </div>
                    <div className="p-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-gray-500" /> Live Tracking
                    </div>
                  </div>
                </div>
              </div>

              {/* Waybill / Header Card Preview */}
              <div className="bg-white border border-[#E5E8ED] rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> Waybill & Invoice Header
                </h3>

                <div className="bg-[#F9FAFB] rounded-xl p-3.5 border border-gray-200">
                  <div className="flex items-start justify-between gap-3 border-b pb-2.5 border-gray-200">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold"
                        style={{ backgroundColor: firmForm.color_primary }}
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-5 h-5 object-contain" />
                        ) : (
                          <Truck className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <div
                          className="text-xs font-extrabold uppercase tracking-tight"
                          style={{ color: firmForm.color_primary }}
                        >
                          {firmForm.firm_name || 'EXPRESS LOGISTICS'}
                        </div>
                        <div className="text-[9.5px] text-gray-500 line-clamp-1">
                          {firmForm.firm_address || 'Main Logistics Cargo Hub'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-mono font-bold text-gray-800">
                        AWB: {firmForm.tracking_prefix}782910
                      </div>
                      <span
                        className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-bold text-white uppercase"
                        style={{ backgroundColor: firmForm.color_primary }}
                      >
                        Express Air
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[10px] text-gray-600 flex justify-between font-medium">
                    <span>Currency: {firmForm.currency_symbol} (INR)</span>
                    <span>Sample Total: {firmForm.currency_symbol} 1,450.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ADMINISTRATOR ACCOUNT */}
        {currentStep === 3 && (
          <div className="bg-white border border-[#E5E8ED] rounded-2xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-100">
                <UserCheck className="w-3.5 h-3.5" /> Step 3: Super Administrator
              </div>
              <h2 className="text-[22px] font-extrabold text-[#111827] tracking-tight">
                Create Master Administrator Account
              </h2>
              <p className="text-gray-500 text-[13px] mt-1">
                This account will have full access to manage shipments, accounts, and system settings.
              </p>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Abram Workman"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Login Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="admin@yourdomain.com"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminForm.confirmPassword}
                  onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                  placeholder="Re-type password"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8ED] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-[#E5E8ED]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-[#E5E8ED] text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creatingAdmin ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Setup & Launch
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: READY TO LAUNCH */}
        {currentStep === 4 && (
          <div className="bg-white border border-[#E5E8ED] rounded-2xl p-8 sm:p-10 shadow-xs max-w-lg mx-auto text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-sm text-white"
              style={{ backgroundColor: firmForm.color_primary || '#10B981' }}
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-[24px] font-extrabold text-[#111827] tracking-tight">
              Portal Successfully Configured!
            </h2>
            <p className="text-gray-500 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
              Your database has been migrated. Your company branding and administrator access are active and ready.
            </p>

            <div className="my-6 bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Firm Name</span>
                <span className="font-bold text-gray-900">{firmForm.firm_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Database</span>
                <span className="font-mono font-bold text-emerald-600">{dbConfig.database}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Admin Account</span>
                <span className="font-mono text-gray-800">{adminForm.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Theme Palette</span>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: firmForm.color_primary }}
                  />
                  {firmForm.color_primary}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer"
              >
                Reconfigure Branding
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Enter Admin Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E8ED] bg-white py-3.5 text-center text-[11px] text-gray-500">
        <p>© {new Date().getFullYear()} {firmForm.firm_name || 'Courier Logistics'} — All rights reserved.</p>
      </footer>
    </div>
  )
}
